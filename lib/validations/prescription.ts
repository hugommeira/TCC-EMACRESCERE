import { z } from "zod";

const medicationSchema = z.object({
  name:         z.string().min(2, "Nome do medicamento obrigatório"),
  dosage:       z.string().min(1, "Dosagem obrigatória"),
  frequency:    z.string().min(1, "Frequência obrigatória"),
  duration:     z.string().min(1, "Duração obrigatória"),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  consultationId: z.string().cuid(),
  medications:    z
    .array(medicationSchema)
    .min(1, "Adicione ao menos um medicamento"),
  notes:     z.string().max(1000).optional(),
  expiresAt: z.coerce.date().optional(),
});

export type MedicationInput         = z.infer<typeof medicationSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
