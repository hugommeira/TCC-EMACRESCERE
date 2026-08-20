// ─── Tipos Prisma estendidos usados nas páginas ───────────────────────────────
// Centralizamos aqui os tipos de queries com includes aninhados
// para evitar repetição e manter type-safety em toda a base

import type { Prisma } from "@prisma/client";

// ConsultationWithParties — usado nas listagens
export type ConsultationWithParties = Prisma.ConsultationGetPayload<{
  include: {
    patient: true;
    doctor:  true;
    payment: true;
  };
}>;

// ConsultationFull — usado na página de detalhes
export type ConsultationFull = Prisma.ConsultationGetPayload<{
  include: {
    patient: {
      include: { patientProfile: true };
    };
    doctor: {
      include: { doctorProfile: true };
    };
    payment:      true;
    messages: {
      include: { sender: true };
    };
    prescription: true;
    followUps:    true;
  };
}>;

// UserWithProfile
export type UserWithProfile = Prisma.UserGetPayload<{
  include: {
    patientProfile: true;
    doctorProfile:  true;
  };
}>;

// PrescriptionWithConsultation
export type PrescriptionWithConsultation = Prisma.PrescriptionGetPayload<{
  include: {
    consultation: {
      include: {
        patient: true;
        doctor: { include: { doctorProfile: true } };
      };
    };
  };
}>;

// MessageWithSender
export type MessageWithSender = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: { id: true; name: true; avatarUrl: true; role: true };
    };
  };
}>;
