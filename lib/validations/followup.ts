import { z } from "zod";

export const createFollowUpSchema = z.object({
  consultationId: z.string().cuid("ID de consulta inválido"),
  message:        z.string().min(5, "Mensagem muito curta").max(1000, "Mensagem muito longa"),
  scheduledAt:    z.coerce.date().optional(),
});

export const respondFollowUpSchema = z.object({
  followUpId: z.string().cuid("ID de follow-up inválido"),
  response:   z.string().min(5, "Resposta muito curta").max(1000, "Resposta muito longa"),
});

export type CreateFollowUpInput  = z.infer<typeof createFollowUpSchema>;
export type RespondFollowUpInput = z.infer<typeof respondFollowUpSchema>;
