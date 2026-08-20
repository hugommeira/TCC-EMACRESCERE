import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/realtime";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { Consultation } from "@prisma/client";

// ─── Constantes ──────────────────────────────────────────────────────────────

export const CONSULTATION_FEE_CENTS = 15000; // R$ 150,00 — TODO: parametrizar
export const CONSULTATION_FEE_REAIS = 150;

// Regras de presença (segundos)
export const PRESENCE_ONLINE_THRESHOLD_SEC  = 45;       // <45s = online (verde)
export const PRESENCE_AWAY_THRESHOLD_SEC    = 120;      // 45s-120s = ausente (amarelo)
                                                         // >120s = offline (vermelho)
export const QUEUE_ABANDON_THRESHOLD_SEC    = 5 * 60;   // 5min sem heartbeat -> CANCELLED
export const NO_SHOW_THRESHOLD_SEC          = 3 * 60;   // 3min de IN_PROGRESS sem conectar -> permite NO_SHOW

// ─── Criar consulta on-demand (paciente solicita atendimento) ────────────────
//
// Fluxo:
//   1. Paciente clica "Quero atendimento agora"
//   2. createOnDemandConsultation cria Consultation status=SCHEDULED, sem médico
//   3. /api/checkout cria Payment associado (Asaas)
//   4. Webhook Asaas confirma pagamento -> moveToQueue (status=WAITING + enqueuedAt)
//   5. Médico chama claimFromQueue (atomic UPDATE)

export async function createOnDemandConsultation(input: {
  patientId:      string;
  chiefComplaint: string;
}): Promise<Consultation> {
  // Bloquear se paciente já tem consulta ativa (na fila ou em atendimento)
  const active = await prisma.consultation.findFirst({
    where: {
      patientId: input.patientId,
      status:    { in: ["SCHEDULED", "WAITING", "IN_PROGRESS"] },
    },
  });
  if (active) {
    throw new ConflictError("Você já tem uma consulta em andamento");
  }

  return prisma.consultation.create({
    data: {
      patientId:      input.patientId,
      status:         "SCHEDULED",
      chiefComplaint: input.chiefComplaint,
    },
  });
}

// ─── Webhook hook: pagamento aprovado -> entra na fila ───────────────────────

export async function moveConsultationToQueue(consultationId: string): Promise<void> {
  const updated = await prisma.consultation.update({
    where: { id: consultationId },
    data:  {
      status:     "WAITING",
      enqueuedAt: new Date(),
    },
    select: {
      id: true, patientId: true, chiefComplaint: true, enqueuedAt: true,
    },
  });

  await publish({
    channel: "queue",
    type:    "queue.entered",
    data:    updated,
  });
  await publish({
    channel: `patient:${updated.patientId}`,
    type:    "patient.queued",
    data:    { consultationId: updated.id, enqueuedAt: updated.enqueuedAt },
  });
}

// ─── Médico pega paciente da fila (atomic) ───────────────────────────────────

export async function claimFromQueue(input: {
  consultationId: string;
  doctorId:       string;
}): Promise<Consultation> {
  // UPDATE condicional — Postgres garante atomicidade.
  // Só altera se ainda está WAITING e doctorId é null.
  const result = await prisma.$queryRaw<Consultation[]>`
    UPDATE consultations
       SET "doctorId"    = ${input.doctorId},
           status        = 'IN_PROGRESS',
           "claimedAt"   = NOW(),
           "startedAt"   = NOW(),
           "livekitRoom" = ${`consultation_${input.consultationId}`},
           "updatedAt"   = NOW()
     WHERE id            = ${input.consultationId}
       AND status        = 'WAITING'
       AND "doctorId"    IS NULL
    RETURNING *;
  `;

  const claimed = result[0];
  if (!claimed) {
    throw new ConflictError("Paciente já foi atendido por outro médico");
  }

  await publish({
    channel: "queue",
    type:    "queue.claimed",
    data:    { consultationId: claimed.id, doctorId: input.doctorId },
  });
  await publish({
    channel: `patient:${claimed.patientId}`,
    type:    "patient.claimed",
    data:    { consultationId: claimed.id, doctorId: input.doctorId },
  });
  await publish({
    channel: `consultation:${claimed.id}`,
    type:    "consultation.started",
    data:    { consultationId: claimed.id, doctorId: input.doctorId },
  });

  return claimed;
}

// ─── Listar fila (médico) ─────────────────────────────────────────────────────
//
// Inclui cleanup oportunista: consultas WAITING cujo paciente está offline
// há mais de QUEUE_ABANDON_THRESHOLD_SEC viram CANCELLED e saem da lista.

export async function listQueue(params?: { take?: number }) {
  const take = params?.take ?? 50;

  // 1) Cleanup: cancela consultas abandonadas
  const abandonCutoff = new Date(Date.now() - QUEUE_ABANDON_THRESHOLD_SEC * 1000);
  const abandoned = await prisma.consultation.findMany({
    where: {
      status:   "WAITING",
      doctorId: null,
      OR: [
        { patientLastSeenAt: { lt: abandonCutoff } },
        // Sem nenhum heartbeat e na fila há mais que o threshold
        { AND: [
            { patientLastSeenAt: null },
            { enqueuedAt:        { lt: abandonCutoff } },
        ]},
      ],
    },
    select: { id: true, patientId: true },
  });

  if (abandoned.length > 0) {
    await prisma.consultation.updateMany({
      where: { id: { in: abandoned.map((c) => c.id) } },
      data:  { status: "CANCELLED", endedAt: new Date() },
    });
    for (const c of abandoned) {
      await publish({
        channel: "queue",
        type:    "queue.abandoned",
        data:    { consultationId: c.id },
      });
      await publish({
        channel: `patient:${c.patientId}`,
        type:    "patient.abandoned",
        data:    { consultationId: c.id },
      });
    }
  }

  // 2) Retorna a fila atual
  return prisma.consultation.findMany({
    where:   { status: "WAITING", doctorId: null },
    orderBy: { enqueuedAt: "asc" },
    take,
    select: {
      id:                true,
      enqueuedAt:        true,
      chiefComplaint:    true,
      patientLastSeenAt: true,
      patient: {
        select: {
          id: true, name: true, avatarUrl: true,
          patientProfile: {
            select: { birthDate: true, gender: true, allergies: true },
          },
        },
      },
    },
  });
}

// ─── Heartbeat do paciente ────────────────────────────────────────────────────

export async function patientHeartbeat(input: {
  consultationId: string;
  patientId:      string;
}) {
  const c = await prisma.consultation.findUnique({
    where:  { id: input.consultationId },
    select: { patientId: true, status: true },
  });
  if (!c)                              throw new NotFoundError("Consulta");
  if (c.patientId !== input.patientId) throw new ForbiddenError("Não é sua consulta");
  if (c.status === "COMPLETED" || c.status === "CANCELLED" || c.status === "NO_SHOW") {
    return { ok: false, status: c.status };
  }

  await prisma.consultation.update({
    where: { id: input.consultationId },
    data:  { patientLastSeenAt: new Date() },
  });

  return { ok: true, status: c.status };
}

// ─── Marcar como NO_SHOW (médico) ─────────────────────────────────────────────

export async function markNoShow(input: {
  consultationId: string;
  doctorId:       string;
}): Promise<Consultation> {
  const c = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
  });
  if (!c) throw new NotFoundError("Consulta");
  if (c.doctorId !== input.doctorId) {
    throw new ForbiddenError("Você não é o médico desta consulta");
  }
  if (c.status !== "IN_PROGRESS") {
    throw new ConflictError("Consulta não está em andamento");
  }

  // Tempo mínimo desde claim antes de permitir NO_SHOW
  if (c.claimedAt) {
    const elapsed = (Date.now() - c.claimedAt.getTime()) / 1000;
    if (elapsed < NO_SHOW_THRESHOLD_SEC) {
      throw new ConflictError(
        `Aguarde mais ${Math.ceil(NO_SHOW_THRESHOLD_SEC - elapsed)}s antes de marcar como não compareceu`,
      );
    }
  }

  const updated = await prisma.consultation.update({
    where: { id: input.consultationId },
    data:  { status: "NO_SHOW", endedAt: new Date() },
  });

  await publish({
    channel: `consultation:${updated.id}`,
    type:    "consultation.no_show",
    data:    { consultationId: updated.id },
  });
  await publish({
    channel: `patient:${updated.patientId}`,
    type:    "patient.no_show",
    data:    { consultationId: updated.id },
  });

  return updated;
}

// ─── Posição do paciente na fila ─────────────────────────────────────────────

export async function getQueuePosition(consultationId: string) {
  const c = await prisma.consultation.findUnique({
    where:  { id: consultationId },
    select: {
      id: true, patientId: true, status: true, doctorId: true,
      enqueuedAt: true, claimedAt: true, patientLastSeenAt: true,
    },
  });
  if (!c) throw new NotFoundError("Consulta");

  if (c.status !== "WAITING" || !c.enqueuedAt) {
    return {
      status:            c.status,
      position:          null,
      ahead:             0,
      doctorId:          c.doctorId,
      patientLastSeenAt: c.patientLastSeenAt?.toISOString() ?? null,
    };
  }

  const ahead = await prisma.consultation.count({
    where: {
      status:     "WAITING",
      doctorId:   null,
      enqueuedAt: { lt: c.enqueuedAt },
    },
  });

  return {
    status:            c.status,
    position:          ahead + 1,
    ahead,
    doctorId:          c.doctorId,
    patientLastSeenAt: c.patientLastSeenAt?.toISOString() ?? null,
  };
}

// ─── Encerrar consulta (médico) ──────────────────────────────────────────────

export async function endConsultation(input: {
  consultationId: string;
  doctorId:       string;
}): Promise<Consultation> {
  const c = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
  });
  if (!c) throw new NotFoundError("Consulta");
  if (c.doctorId !== input.doctorId) {
    throw new ForbiddenError("Você não é o médico desta consulta");
  }
  if (c.status !== "IN_PROGRESS") {
    throw new ConflictError("Consulta não está em andamento");
  }

  const updated = await prisma.consultation.update({
    where: { id: input.consultationId },
    data:  { status: "COMPLETED", endedAt: new Date() },
  });

  await publish({
    channel: `consultation:${updated.id}`,
    type:    "consultation.ended",
    data:    { consultationId: updated.id },
  });
  await publish({
    channel: `patient:${updated.patientId}`,
    type:    "patient.consultation_ended",
    data:    { consultationId: updated.id },
  });

  return updated;
}
