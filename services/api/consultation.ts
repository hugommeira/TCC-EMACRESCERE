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

export async function updateConsultationStatus(
  id: string,
  status: ConsultationStatus,
  actorId: string,
): Promise<ConsultationWithParties> {
  const consultation = await prisma.consultation.findUnique({ where: { id } });
  if (!consultation) throw new NotFoundError("Consulta");

  const isDoctor  = consultation.doctorId  === actorId;
  const isPatient = consultation.patientId === actorId;

  if (!isDoctor && !isPatient) throw new ForbiddenError();

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

  if (["COMPLETED", "CANCELLED"].includes(consultation.status)) {
    throw new ConflictError("Consulta não pode ser cancelada neste estado");
  }

  return prisma.consultation.update({
    where: { id: input.consultationId },
    data:  { status: "CANCELLED" },
    include: { patient: true, doctor: true, payment: true },
  });
}
