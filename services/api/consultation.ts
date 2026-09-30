import { prisma } from "@/lib/prisma";
import { NotFoundError, ForbiddenError, ConflictError } from "@/lib/errors";
import { generateRoomToken } from "@/lib/utils";
import type {
  ScheduleConsultationInput,
  CancelConsultationInput,
} from "@/lib/validations/consultation";
import type { ConsultationFull, ConsultationWithParties, PaginationParams, PaginatedResponse } from "@/types";
import type { ConsultationStatus, Prisma } from "@prisma/client";
import {
  MIN_LEAD_MINUTES,
  UNPAID_HOLD_MINUTES,
  patientCancelIsRefundable,
  isOfferedSlot,
  normalizeWeekHours,
  slotsForDate,
  toInstant,
} from "@/lib/scheduling";

// ─── Ocupação de horário ──────────────────────────────────────────────────────

/**
 * Consultas que ocupam o horário do médico:
 * - pagas, ou já chamadas/em andamento/concluídas;
 * - com Pix/boleto gerado e ainda dentro do vencimento (o paciente está pagando);
 * - criadas há menos de UNPAID_HOLD_MINUTES, sem cobrança ainda.
 * Consulta abandonada antes de gerar a cobrança libera o horário depois disso.
 */
export function occupyingWhere(doctorId: string, now = new Date()): Prisma.ConsultationWhereInput {
  const holdStart = new Date(now.getTime() - UNPAID_HOLD_MINUTES * 60_000);
  return {
    doctorId,
    status: { notIn: ["CANCELLED", "NO_SHOW"] },
    OR: [
      { status: { in: ["WAITING", "IN_PROGRESS", "COMPLETED"] } },
      { payment: { status: { in: ["RECEIVED", "CONFIRMED"] } } },
      { payment: { status: "PENDING", expiresAt: { gt: now } } },
      { createdAt: { gte: holdStart } },
    ],
  };
}

export interface DaySlot {
  time:      string; // "HH:MM", horário de São Paulo
  startsAt:  string; // ISO UTC — é isso que o cliente devolve ao agendar
  available: boolean;
}

/** Horários de um médico num dia, marcando os já ocupados e os que já passaram. */
export async function getDoctorDaySlots(doctorId: string, date: string): Promise<DaySlot[]> {
  const doctor = await prisma.doctorProfile.findUnique({
    where:  { userId: doctorId },
    select: { availableHours: true, available: true, approvalStatus: true },
  });
  if (!doctor || !doctor.available || doctor.approvalStatus !== "APPROVED") {
    throw new NotFoundError("Médico");
  }

  const times = slotsForDate(normalizeWeekHours(doctor.availableHours), date);
  if (times.length === 0) return [];

  const dayStart = toInstant(date, "00:00");
  const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60_000);
  const taken = await prisma.consultation.findMany({
    where:  { ...occupyingWhere(doctorId), scheduledAt: { gte: dayStart, lt: dayEnd } },
    select: { scheduledAt: true },
  });
  const takenAt = new Set(taken.map((c) => c.scheduledAt?.getTime()));
  const earliest = Date.now() + MIN_LEAD_MINUTES * 60_000;

  return times.map((time) => {
    const at = toInstant(date, time);
    return {
      time,
      startsAt:  at.toISOString(),
      available: at.getTime() >= earliest && !takenAt.has(at.getTime()),
    };
  });
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function scheduleConsultation(
  patientId: string,
  input: ScheduleConsultationInput,
): Promise<ConsultationWithParties> {
  // Verificar se médico existe e está disponível
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: input.doctorId },
  });

  if (!doctor) throw new NotFoundError("Médico");
  if (!doctor.available) throw new ConflictError("Médico indisponível no momento");
  // Médico pendente/reprovado não aparece na lista, mas a API aceitava o id.
  if (doctor.approvalStatus !== "APPROVED") throw new ConflictError("Médico indisponível no momento");

  // O horário precisa ser um dos que o médico oferece na agenda dele. Antes o
  // site oferecia 8h–18h todo dia, inclusive fim de semana, ignorando a agenda
  // configurada em "Meu perfil".
  if (!isOfferedSlot(normalizeWeekHours(doctor.availableHours), input.scheduledAt)) {
    throw new ConflictError("Esse horário não está na agenda do médico");
  }
  if (input.scheduledAt.getTime() < Date.now() + MIN_LEAD_MINUTES * 60_000) {
    throw new ConflictError(`Agende com pelo menos ${MIN_LEAD_MINUTES} minutos de antecedência`);
  }

  // Verificar conflito de horário
  const conflict = await prisma.consultation.findFirst({
    where: { ...occupyingWhere(input.doctorId), scheduledAt: input.scheduledAt },
  });

  if (conflict) throw new ConflictError("Horário já ocupado para este médico");

  // Mesmo paciente, mesmo horário, outro médico: não dá pra estar em duas.
  const clash = await prisma.consultation.findFirst({
    where: {
      patientId,
      scheduledAt: input.scheduledAt,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      OR: [
        { payment: { status: { in: ["RECEIVED", "CONFIRMED"] } } },
        { createdAt: { gte: new Date(Date.now() - UNPAID_HOLD_MINUTES * 60_000) } },
      ],
    },
  });
  if (clash) throw new ConflictError("Você já tem uma consulta marcada nesse horário");

  const consultation = await prisma.consultation.create({
    data: {
      patientId:      patientId,
      doctorId:       input.doctorId,
      scheduledAt:    input.scheduledAt,
      chiefComplaint: input.chiefComplaint,
      roomToken:      generateRoomToken(),
    },
    include: { patient: true, doctor: true, payment: true },
  });

  return consultation;
}

// ─── Get by ID ────────────────────────────────────────────────────────────────

export async function getConsultationById(
  id: string,
  requesterId: string,
): Promise<ConsultationFull> {
  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: {
      patient:      true,
      doctor:       true,
      payment:      true,
      messages:     { include: { sender: true }, orderBy: { createdAt: "asc" } },
      prescription: true,
      followUps:    true,
    },
  });

  if (!consultation) throw new NotFoundError("Consulta");

  const isParticipant =
    consultation.patientId === requesterId ||
    consultation.doctorId  === requesterId;

  if (!isParticipant) throw new ForbiddenError();

  return consultation;
}

// ─── List by patient ──────────────────────────────────────────────────────────

export async function listPatientConsultations(
  patientId: string,
  params: PaginationParams & { status?: ConsultationStatus; q?: string },
): Promise<PaginatedResponse<ConsultationWithParties>> {
  const page  = Math.max(1, params.page  ?? 1);
  const limit = Math.min(50, Math.max(5, params.limit ?? 10));
  const skip  = (page - 1) * limit;

  const where = {
    patientId,
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? {
          OR: [
            { chiefComplaint: { contains: params.q, mode: "insensitive" as const } },
            { doctor:         { name: { contains: params.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.consultation.findMany({
      where,
      include: { patient: true, doctor: true, payment: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.consultation.count({ where }),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── List by doctor ───────────────────────────────────────────────────────────

export async function listDoctorConsultations(
  doctorId: string,
  params: PaginationParams & { status?: ConsultationStatus; q?: string },
): Promise<PaginatedResponse<ConsultationWithParties>> {
  const page  = Math.max(1, params.page  ?? 1);
  const limit = Math.min(50, Math.max(5, params.limit ?? 10));
  const skip  = (page - 1) * limit;

  const where = {
    doctorId,
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? {
          OR: [
            { chiefComplaint: { contains: params.q, mode: "insensitive" as const } },
            { patient:        { name: { contains: params.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.consultation.findMany({
      where,
      include: { patient: true, doctor: true, payment: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.consultation.count({ where }),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── Update status ────────────────────────────────────────────────────────────

// Transições válidas de status (quem muda é o médico; ver updateConsultationStatus)
const STATUS_TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  SCHEDULED:   ["WAITING", "IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  WAITING:     ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED:   [],
  CANCELLED:   [],
  NO_SHOW:     [],
};

const STATUS_LABEL: Record<ConsultationStatus, string> = {
  SCHEDULED:   "agendada",
  WAITING:     "em espera",
  IN_PROGRESS: "em andamento",
  COMPLETED:   "concluída",
  CANCELLED:   "cancelada",
  NO_SHOW:     "não compareceu",
};

export async function updateConsultationStatus(
  id: string,
  status: ConsultationStatus,
  actorId: string,
): Promise<ConsultationWithParties> {
  const consultation = await prisma.consultation.findUnique({
    where:   { id },
    include: { payment: { select: { id: true, status: true } } },
  });
  if (!consultation) throw new NotFoundError("Consulta");

  // Só o médico da consulta muda o status por aqui (o paciente cancela via
  // /cancel). Antes bastava ser parte da consulta: o paciente conseguia
  // marcar a própria consulta como COMPLETED/IN_PROGRESS pela API.
  if (consultation.doctorId !== actorId) throw new ForbiddenError();

  const allowed = STATUS_TRANSITIONS[consultation.status] ?? [];
  if (!allowed.includes(status)) {
    throw new ConflictError(
      `Consulta ${STATUS_LABEL[consultation.status]} não pode passar para ${STATUS_LABEL[status]}`,
    );
  }

  // Regras do agendamento (consulta com data marcada).
  if (consultation.scheduledAt) {
    const paid = consultation.payment?.status === "RECEIVED" || consultation.payment?.status === "CONFIRMED";
    // Antes o médico conseguia chamar/iniciar uma consulta que o paciente
    // nunca pagou (ou que abandonou na tela de pagamento).
    if ((status === "WAITING" || status === "IN_PROGRESS") && !paid) {
      throw new ConflictError("O pagamento desta consulta ainda não foi confirmado");
    }
    // "Não compareceu" só faz sentido depois do horário marcado.
    if (status === "NO_SHOW" && consultation.scheduledAt.getTime() > Date.now()) {
      throw new ConflictError("Só dá pra marcar falta depois do horário da consulta");
    }
  }

  // Médico cancelando pelo painel: estorno integral (política em lib/scheduling.ts).
  if (status === "CANCELLED") await settleCancellationPayment(consultation, "DOCTOR");

  const now = new Date();

  return prisma.consultation.update({
    where: { id },
    data: {
      status,
      ...(status === "IN_PROGRESS" ? { startedAt: now } : {}),
      ...(status === "COMPLETED"   ? { endedAt:   now } : {}),
    },
    include: { patient: true, doctor: true, payment: true },
  });
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

/**
 * Aplica a política de estorno (lib/scheduling.ts) a um cancelamento. Antes
 * nenhum cancelamento devolvia dinheiro: refundPayment existia, mas nada o
 * chamava. Roda ANTES de marcar a consulta como cancelada — se o estorno
 * falhar no gateway, o cancelamento não acontece e o paciente não fica sem a
 * consulta e sem o dinheiro.
 */
async function settleCancellationPayment(
  c: { id: string; scheduledAt: Date | null; payment: { id: string; status: string } | null },
  cancelledBy: "PATIENT" | "DOCTOR",
): Promise<"REFUNDED" | "NO_REFUND" | "NOT_PAID"> {
  const paid = c.payment?.status === "RECEIVED" || c.payment?.status === "CONFIRMED";
  if (!c.payment || !paid) return "NOT_PAID";

  const refundable =
    cancelledBy === "DOCTOR" ||
    !c.scheduledAt || // on-demand ainda não atendida
    patientCancelIsRefundable(c.scheduledAt);
  if (!refundable) return "NO_REFUND";

  const { refundPayment } = await import("./payment");
  try {
    await refundPayment(c.payment.id);
  } catch (err) {
    console.error("[cancel] estorno falhou:", err);
    throw new ConflictError("Não foi possível processar o estorno agora. Tente de novo em alguns minutos.");
  }
  return "REFUNDED";
}

export async function cancelConsultation(
  actorId: string,
  input: CancelConsultationInput,
): Promise<ConsultationWithParties> {
  const consultation = await prisma.consultation.findUnique({
    where:   { id: input.consultationId },
    include: { payment: { select: { id: true, status: true } } },
  });

  if (!consultation) throw new NotFoundError("Consulta");

  if (
    consultation.patientId !== actorId &&
    consultation.doctorId  !== actorId
  ) {
    throw new ForbiddenError();
  }
  const cancelledBy = consultation.doctorId === actorId ? "DOCTOR" : "PATIENT";

  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(consultation.status)) {
    throw new ConflictError("Consulta não pode ser cancelada neste estado");
  }

  // Em andamento, quem encerra é o médico (/end). O paciente conseguia
  // "desmarcar" pelo app no meio do atendimento e a consulta sumia da sala.
  if (consultation.status === "IN_PROGRESS" && consultation.patientId === actorId) {
    throw new ConflictError("A consulta já está em andamento — peça ao médico para encerrá-la");
  }

  await settleCancellationPayment(consultation, cancelledBy);

  return prisma.consultation.update({
    where: { id: input.consultationId },
    data:  { status: "CANCELLED" },
    include: { patient: true, doctor: true, payment: true },
  });
}

// ─── Saída pra API ────────────────────────────────────────────────────────────

/**
 * Remove o CPF das partes antes de responder pro cliente: paciente não
 * precisa do CPF do médico (nem vice-versa nas telas do app/site).
 * Admin tem as rotas /api/admin/* com o dado completo.
 */
type WithCpf = { cpf?: string | null } | null | undefined;
function withoutCpf<U extends WithCpf>(u: U): U {
  if (!u) return u;
  const { cpf: _cpf, ...rest } = u;
  return rest as U;
}

export function stripPartyPii<
  T extends { patient?: WithCpf; doctor?: WithCpf; messages?: { sender?: WithCpf }[] },
>(c: T): T {
  return {
    ...c,
    patient: withoutCpf(c.patient),
    doctor:  withoutCpf(c.doctor),
    ...(c.messages
      ? { messages: c.messages.map((m) => ({ ...m, sender: withoutCpf(m.sender) })) }
      : {}),
  };
}
