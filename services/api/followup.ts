import { prisma }         from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { FollowUp }  from "@prisma/client";

// ─── Create follow-up ─────────────────────────────────────────────────────────

export async function createFollowUp(
  doctorId:       string,
  consultationId: string,
  message:        string,
  scheduledAt?:   Date,
): Promise<FollowUp> {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!consultation)               throw new AppError("CONSULTA_NAO_ENCONTRADA");
  if (consultation.doctorId !== doctorId) throw new AppError("CONSULTA_SEM_ACESSO");

  return prisma.followUp.create({
    data: {
      consultationId,
      message,
      scheduledAt,
      status: "PENDING",
    },
  });
}

// ─── List follow-ups by consultation ──────────────────────────────────────────

export async function listFollowUps(
  consultationId: string,
  requesterId:    string,
): Promise<FollowUp[]> {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!consultation) throw new AppError("CONSULTA_NAO_ENCONTRADA");

  const isParticipant =
    consultation.patientId === requesterId ||
    consultation.doctorId  === requesterId;

  if (!isParticipant) throw new AppError("CONSULTA_SEM_ACESSO");

  return prisma.followUp.findMany({
    where:   { consultationId },
    orderBy: { createdAt: "asc" },
  });
}

// ─── Patient responds to follow-up ───────────────────────────────────────────

export async function respondToFollowUp(
  followUpId: string,
  patientId:  string,
  response:   string,
): Promise<FollowUp> {
  const followUp = await prisma.followUp.findUnique({
    where:   { id: followUpId },
    include: { consultation: true },
  });

  if (!followUp) throw new AppError("NAO_ENCONTRADO", { message: "Acompanhamento não encontrado." });
  if (followUp.consultation.patientId !== patientId) throw new AppError("CONSULTA_SEM_ACESSO");

  return prisma.followUp.update({
    where: { id: followUpId },
    data: {
      response,
      respondedAt: new Date(),
      status:      "RESPONDED",
    },
  });
}

// ─── Mark as sent ─────────────────────────────────────────────────────────────

export async function markFollowUpSent(followUpId: string): Promise<FollowUp> {
  return prisma.followUp.update({
    where: { id: followUpId },
    data:  { sentAt: new Date(), status: "SENT" },
  });
}

// ─── Close follow-up ──────────────────────────────────────────────────────────

export async function closeFollowUp(
  followUpId: string,
  doctorId:   string,
): Promise<FollowUp> {
  const followUp = await prisma.followUp.findUnique({
    where:   { id: followUpId },
    include: { consultation: true },
  });

  if (!followUp) throw new AppError("NAO_ENCONTRADO", { message: "Acompanhamento não encontrado." });
  if (followUp.consultation.doctorId !== doctorId) throw new AppError("CONSULTA_SEM_ACESSO");

  return prisma.followUp.update({
    where: { id: followUpId },
    data:  { status: "CLOSED" },
  });
}
