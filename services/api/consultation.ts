import { prisma } from "@/lib/prisma";
import { NotFoundError, ForbiddenError, ConflictError } from "@/lib/errors";
import { generateRoomToken } from "@/lib/utils";
import type {
  ScheduleConsultationInput,
  CancelConsultationInput,
} from "@/lib/validations/consultation";
import type { ConsultationFull, ConsultationWithParties, PaginationParams, PaginatedResponse } from "@/types";
import type { ConsultationStatus } from "@prisma/client";

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

  // Verificar conflito de horário
  const conflict = await prisma.consultation.findFirst({
    where: {
      doctorId:    input.doctorId,
      scheduledAt: input.scheduledAt,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
  });

  if (conflict) throw new ConflictError("Horário já ocupado para este médico");

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
  const consultation = await prisma.consultation.findUnique({ where: { id } });
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

export async function cancelConsultation(
  actorId: string,
  input: CancelConsultationInput,
): Promise<ConsultationWithParties> {
  const consultation = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
  });

  if (!consultation) throw new NotFoundError("Consulta");

  if (
    consultation.patientId !== actorId &&
    consultation.doctorId  !== actorId
  ) {
    throw new ForbiddenError();
  }

  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(consultation.status)) {
    throw new ConflictError("Consulta não pode ser cancelada neste estado");
  }

  // Em andamento, quem encerra é o médico (/end). O paciente conseguia
  // "desmarcar" pelo app no meio do atendimento e a consulta sumia da sala.
  if (consultation.status === "IN_PROGRESS" && consultation.patientId === actorId) {
    throw new ConflictError("A consulta já está em andamento — peça ao médico para encerrá-la");
  }

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
