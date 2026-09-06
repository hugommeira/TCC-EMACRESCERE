import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validations/auth";

const VALID_INPUT = {
  name: "Maria Oliveira",
  email: "nova.paciente@example.com",
  cpf: "52998224725",
  password: "Xk9mPqz2",
  confirmPassword: "Xk9mPqz2",
  acceptedTerms: true,
};

describe("registerSchema", () => {
  it("aceita cadastro válido com termos aceitos", () => {
    const result = registerSchema.safeParse(VALID_INPUT);
    expect(result.success).toBe(true);
  });

  it("rejeita quando acceptedTerms é false", () => {
    const result = registerSchema.safeParse({ ...VALID_INPUT, acceptedTerms: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.acceptedTerms?.[0]).toMatch(/Termos de Uso/);
    }
  });

  it("rejeita quando as senhas não conferem", () => {
    const result = registerSchema.safeParse({ ...VALID_INPUT, confirmPassword: "Outra123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.confirmPassword?.[0]).toMatch(/não conferem/);
    }
  });

  it("rejeita CPF com dígito verificador inválido", () => {
    const result = registerSchema.safeParse({ ...VALID_INPUT, cpf: "52998224700" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha sem letra maiúscula", () => {
    const result = registerSchema.safeParse({
      ...VALID_INPUT,
      password: "xk9mpqz2",
      confirmPassword: "xk9mpqz2",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita senha muito comum, mesmo satisfazendo as regras de formato", () => {
    const blocked = registerSchema.safeParse({
      ...VALID_INPUT,
      password: "Senha1234",
      confirmPassword: "Senha1234",
    });
    expect(blocked.success).toBe(false);

    // troca só a capitalização/dígitos pra sair da lista de bloqueadas,
    // mantendo o mesmo formato — confirma que o bloqueio é pela lista, não pela forma
    const notBlocked = registerSchema.safeParse({
      ...VALID_INPUT,
      password: "Xyzabc12",
      confirmPassword: "Xyzabc12",
    });
    expect(notBlocked.success).toBe(true);
  });

  it("rejeita senha que contém o prefixo do e-mail", () => {
    const result = registerSchema.safeParse({
      ...VALID_INPUT,
      email: "mariaoliveira@example.com",
      password: "Mariaoliveira1",
      confirmPassword: "Mariaoliveira1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita e-mail e senha válidos", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = loginSchema.safeParse({ email: "não-é-email", password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("normaliza e-mail para minúsculas", () => {
    const result = loginSchema.safeParse({ email: "USER@EXAMPLE.COM", password: "12345678" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});
