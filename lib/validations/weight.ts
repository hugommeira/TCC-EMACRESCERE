import { z } from "zod";
import {
  WEIGHT_MIN_KG,
  WEIGHT_MAX_KG,
  HEIGHT_MIN_CM,
  HEIGHT_MAX_CM,
} from "@/lib/bmi";

export const createWeightRecordSchema = z.object({
  weightKg: z.coerce
    .number({ invalid_type_error: "Informe o peso em quilos" })
    .min(WEIGHT_MIN_KG, `O peso deve ser maior que ${WEIGHT_MIN_KG} kg`)
    .max(WEIGHT_MAX_KG, `O peso deve ser menor que ${WEIGHT_MAX_KG} kg`),
  measuredAt: z.coerce.date().optional(),
  note:       z.string().trim().max(280, "Observação muito longa").optional(),
  // Só o médico usa: vincula a pesagem à consulta em que ela foi aferida.
  patientId:      z.string().cuid().optional(),
  consultationId: z.string().cuid().optional(),
});

export const updatePatientMetricsSchema = z.object({
  heightCm: z.coerce
    .number({ invalid_type_error: "Informe a altura em centímetros" })
    .int("Use centímetros inteiros")
    .min(HEIGHT_MIN_CM, `A altura deve ser maior que ${HEIGHT_MIN_CM} cm`)
    .max(HEIGHT_MAX_CM, `A altura deve ser menor que ${HEIGHT_MAX_CM} cm`)
    .nullable()
    .optional(),
  goalWeightKg: z.coerce
    .number({ invalid_type_error: "Informe a meta em quilos" })
    .min(WEIGHT_MIN_KG, `A meta deve ser maior que ${WEIGHT_MIN_KG} kg`)
    .max(WEIGHT_MAX_KG, `A meta deve ser menor que ${WEIGHT_MAX_KG} kg`)
    .nullable()
    .optional(),
});

/** Filtro de período do gráfico. "all" = histórico inteiro. */
export const weightRangeSchema = z.enum(["30d", "90d", "180d", "365d", "all"]);

export const listWeightQuerySchema = z.object({
  patientId: z.string().cuid().optional(),
  range:     weightRangeSchema.default("all"),
});

export type CreateWeightRecordInput    = z.infer<typeof createWeightRecordSchema>;
export type UpdatePatientMetricsInput  = z.infer<typeof updatePatientMetricsSchema>;
export type WeightRange                = z.infer<typeof weightRangeSchema>;
