import { z } from "zod";

// Top senhas vazadas mais comuns. Bloqueia ataques baseados em listas conhecidas.
const COMMON_WEAK_PASSWORDS = new Set<string>([
  "12345678", "123456789", "1234567890", "password", "password1", "password123",
  "qwerty123", "qwertyuiop", "11111111", "00000000", "admin123", "iloveyou",
  "welcome123", "letmein123", "abc12345", "abcd1234", "12345678a", "asdf1234",
  "zaq12wsx", "qwer1234", "1q2w3e4r", "1qaz2wsx", "p@ssw0rd", "passw0rd",
  "senha123", "senha1234", "senha2024", "senha@123", "brasil2024", "neymar10",
  "sigmaboy",
]);

// Validação CPF com dígitos verificadores
function validateCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11)            return false;
  if (/^(\d)\1{10}$/.test(cpf))     return false; // todos iguais
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf.charAt(i)) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== Number(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf.charAt(i)) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === Number(cpf.charAt(10));
}

export const loginSchema = z.object({
  email: z
    .string({ required_error: "E-mail obrigatório" })
    .email("E-mail inválido")
    .toLowerCase()
    .trim()
    .max(254),
  password: z
    .string({ required_error: "Senha obrigatória" })
    .min(8, "Mínimo 8 caracteres")
    .max(128),
});

// Campos comuns ao cadastro de paciente e de médico. Os .refine() ficam
// fora porque ZodEffects não tem .extend() — o schema de médico precisa
// estender o objeto base.
const registerBaseSchema = z
  .object({
    name: z
      .string({ required_error: "Nome obrigatório" })
      .min(2, "Nome muito curto")
      .max(120, "Nome muito longo")
      .trim()
      .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ '.-]+$/, "Nome contém caracteres inválidos"),
    email: z
      .string({ required_error: "E-mail obrigatório" })
      .email("E-mail inválido")
      .toLowerCase()
      .trim()
      .max(254),
    cpf: z
      .string({ required_error: "CPF obrigatório" })
      .regex(/^\d{11}$/, "CPF inválido (somente números, 11 dígitos)")
      .refine(validateCpf, "CPF inválido"),
    phone: z
      .string()
      .regex(/^\d{10,11}$/, "Telefone inválido")
      .optional(),
    password: z
      .string({ required_error: "Senha obrigatória" })
      .min(8, "Mínimo 8 caracteres")
      .max(128, "Senha muito longa")
      .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
      .regex(/[0-9]/, "Deve conter ao menos um número")
      .refine(
        (p) => !COMMON_WEAK_PASSWORDS.has(p.toLowerCase()),
        "Senha muito comum, escolha outra",
      ),
    confirmPassword: z.string({ required_error: "Confirmação obrigatória" }),
    acceptedTerms: z.boolean(),
  });

/** Regras que valem pros dois cadastros (senha confere, sem e-mail na senha, termos). */
function withRegisterRules<S extends typeof registerBaseSchema.shape>(schema: z.ZodObject<S>) {
  return schema
    .refine((d) => d.password === d.confirmPassword, {
      message: "Senhas não conferem",
      path: ["confirmPassword"],
    })
    .refine(
      (d) => !d.password.toLowerCase().includes(d.email.split("@")[0]?.toLowerCase() ?? ""),
      {
        message: "Senha não pode conter seu e-mail",
        path: ["password"],
      },
    )
    .refine((d) => d.acceptedTerms === true, {
      message: "É necessário aceitar os Termos de Uso e a Política de Privacidade",
      path: ["acceptedTerms"],
    });
}

export const registerSchema = withRegisterRules(registerBaseSchema);

// Cadastro de MÉDICO: os mesmos campos do paciente + dados do conselho. O CRM
// passa por verificação (simulada) em services/external/cfm.ts e a conta
// nasce com approvalStatus PENDING até o admin aprovar.
export const registerDoctorSchema = withRegisterRules(
  registerBaseSchema.extend({
    role: z.literal("DOCTOR"),
    crm: z
      .string({ required_error: "CRM obrigatório" })
      .trim()
      .regex(/^\d{4,7}$/, "CRM inválido (4 a 7 dígitos)"),
    crmState: z
      .string({ required_error: "UF do CRM obrigatória" })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "UF inválida"),
    specialty: z
      .string({ required_error: "Especialidade obrigatória" })
      .trim()
      .min(3, "Especialidade muito curta")
      .max(80, "Especialidade muito longa"),
  }),
);

export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "E-mail obrigatório" })
    .email("E-mail inválido")
    .toLowerCase()
    .trim()
    .max(254),
});

export const resetPasswordSchema = z
  .object({
    token: z.string({ required_error: "Token obrigatório" }).min(1),
    password: z
      .string({ required_error: "Senha obrigatória" })
      .min(8, "Mínimo 8 caracteres")
      .max(128, "Senha muito longa")
      .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
      .regex(/[0-9]/, "Deve conter ao menos um número")
      .refine(
        (p) => !COMMON_WEAK_PASSWORDS.has(p.toLowerCase()),
        "Senha muito comum, escolha outra",
      ),
    confirmPassword: z.string({ required_error: "Confirmação obrigatória" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export type LoginInput          = z.infer<typeof loginSchema>;
export type RegisterInput       = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput  = z.infer<typeof resetPasswordSchema>;
