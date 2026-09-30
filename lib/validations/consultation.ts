import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const scheduleConsultationSchema = z.object({
  doctorId:      z.string().cuid("ID de médico inválido"),
  // .min(new Date()) avaliava o "agora" uma vez só, no carregamento do módulo:
  // num servidor de pé há dias, datas já passadas eram aceitas. O refine
  // compara com o relógio a cada requisição.
  scheduledAt:   z.coerce.date().refine((d) => d.getTime() > Date.now(), "Data deve ser futura"),
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
