import { z } from "zod";
import { MEASURES, MEASURE_TYPES } from "@/lib/measures";

export const createMeasureSchema = z
  .object({
    type:  z.enum(MEASURE_TYPES, { errorMap: () => ({ message: "Medida inválida" }) }),
    value: z.coerce.number({ invalid_type_error: "Informe um número" }),
    measuredAt: z.coerce
      .date({ invalid_type_error: "Data inválida" })
      .refine((d) => d.getTime() <= Date.now() + 5 * 60_000, "A data não pode estar no futuro")
      .optional(),
    note:           z.string().trim().max(280, "Observação muito longa").optional(),
    patientId:      z.string().cuid().optional(),
    consultationId: z.string().cuid().optional(),
  })
  .superRefine((d, ctx) => {
    const def = MEASURES[d.type];
    if (d.value < def.min || d.value > def.max) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ["value"],
        message: `${def.label}: use um valor entre ${def.min} e ${def.max} ${def.unit}`,
      });
    }
  });

export type CreateMeasureInput = z.infer<typeof createMeasureSchema>;

export const listMeasuresQuerySchema = z.object({
  patientId: z.string().cuid().optional(),
});
