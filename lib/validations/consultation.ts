import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const scheduleConsultationSchema = z.object({
  doctorId:      z.string().cuid("ID de médico inválido"),
  scheduledAt:   z.coerce.date().min(new Date(), "Data deve ser futura"),
  chiefComplaint: z
    .string()
    .min(10, "Descreva o motivo da consulta (mínimo 10 caracteres)")
    .max(500),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

export const cancelConsultationSchema = z.object({
  consultationId: z.string().cuid(),
  reason:         z.string().min(5).max(300).optional(),
});

export type ScheduleConsultationInput = z.infer<typeof scheduleConsultationSchema>;
export type CancelConsultationInput   = z.infer<typeof cancelConsultationSchema>;
