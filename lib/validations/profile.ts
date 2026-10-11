import { z } from "zod";
import { strongPasswordSchema } from "@/lib/validations/auth";
import { updatePatientMetricsSchema } from "@/lib/validations/weight";

// Edição do perfil (paciente e médico) e troca de senha.
// Campo em branco no formulário chega como "" e vira null (apaga o valor).

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const GENDERS     = ["Feminino", "Masculino", "Outro", "Prefiro não informar"] as const;

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Lista de itens (alergias, medicamentos): sem vazios nem repetidos. */
const itemList = z
  .array(z.string().trim().max(80, "Cada item pode ter até 80 caracteres"))
  .max(30, "No máximo 30 itens")
  .transform((arr) => Array.from(new Set(arr.filter(Boolean))));

/** Telefone com ou sem máscara → só dígitos (DDD + número); vazio apaga. */
const phoneSchema = z.preprocess(
  (v) => (typeof v === "string" ? (v.replace(/\D/g, "") || null) : v),
  z.string().regex(/^\d{10,11}$/, "Telefone inválido (DDD + número)").nullable().optional(),
);

const shortText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max, `Até ${max} caracteres`).nullable().optional());

export const updateProfileSchema = z.object({
  // Conta (paciente e médico)
  name: z
    .string()
    .trim()
    .min(2, "Nome muito curto")
    .max(120, "Nome muito longo")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ '.-]+$/, "Nome contém caracteres inválidos")
    .optional(),
  phone: phoneSchema,

  // Saúde (só paciente)
  // "aaaa-mm-dd" do <input type="date"> vira meia-noite de Brasília (como no
  // seed): meia-noite UTC apareceria como o dia anterior em formatDate.
  birthDate: z.preprocess(
    (v) => {
      const n = emptyToNull(v);
      return typeof n === "string" && /^\d{4}-\d{2}-\d{2}$/.test(n) ? `${n}T03:00:00.000Z` : n;
    },
    z.coerce
      .date({ invalid_type_error: "Data inválida" })
      .refine((d) => d <= new Date(), "A data não pode estar no futuro")
      .refine((d) => d.getFullYear() >= 1900, "Data inválida")
      .nullable()
      .optional(),
  ),
  // Texto livre curto: o app Flutter grava o que a pessoa digitar; o site
  // oferece a lista GENDERS.
  gender:      z.preprocess(emptyToNull, z.string().trim().max(30).nullable().optional()),
  bloodType:   z.preprocess(emptyToNull, z.enum(BLOOD_TYPES).nullable().optional()),
  allergies:   itemList.optional(),
  medications: itemList.optional(),
  notes:       z.preprocess(emptyToNull, z.string().trim().max(1000, "Até 1000 caracteres").nullable().optional()),
  heightCm:     z.preprocess(emptyToNull, updatePatientMetricsSchema.shape.heightCm),
  goalWeightKg: z.preprocess(emptyToNull, updatePatientMetricsSchema.shape.goalWeightKg),
  emergencyContactName: z.preprocess(
    emptyToNull,
    z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo").nullable().optional(),
  ),
  emergencyContactPhone:    phoneSchema,
  emergencyContactRelation: shortText(40),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Campos que só o paciente pode mandar. */
export const PATIENT_FIELDS = [
  "birthDate", "gender", "bloodType", "allergies", "medications", "notes", "heightCm", "goalWeightKg",
  "emergencyContactName", "emergencyContactPhone", "emergencyContactRelation",
] as const;

// ─── Formação do médico (PATCH /api/doctor/profile) ───────────────────────────

export const doctorEducationSchema = z.object({
  graduationSchool: shortText(160),
  graduationYear: z.preprocess(
    emptyToNull,
    z.coerce
      .number({ invalid_type_error: "Ano inválido" })
      .int("Ano inválido")
      .min(1950, "Ano inválido")
      .refine((y) => y <= new Date().getFullYear(), "O ano não pode estar no futuro")
      .nullable()
      .optional(),
  ),
  residency: shortText(200),
  languages: z
    .array(z.string().trim().max(40, "Cada idioma pode ter até 40 caracteres"))
    .max(10, "No máximo 10 idiomas")
    .transform((arr) => Array.from(new Set(arr.filter(Boolean))))
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: "Informe a senha atual" }).min(1, "Informe a senha atual").max(128),
    newPassword:     strongPasswordSchema,
    confirmPassword: z.string({ required_error: "Confirmação obrigatória" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Senhas não conferem",
    path:    ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "A nova senha deve ser diferente da atual",
    path:    ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Foto de perfil ───────────────────────────────────────────────────────────

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

/** Confere a assinatura do arquivo (não confia só no MIME que o navegador manda). */
export function avatarMimeFromBytes(b: Uint8Array): (typeof AVATAR_MIME)[number] | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&   // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50    // WEBP
  ) return "image/webp";
  return null;
}
