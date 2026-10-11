import { beforeEach, describe, expect, it, vi } from "vitest";

// Login e middleware: os motivos de recusa precisam chegar distintos ao site
// e ao app (antes bloqueio e conta desativada pareciam "senha incorreta"), e
// uma chamada de API sem sessão precisa de 401 JSON, não de uma página HTML.

const h = vi.hoisted(() => ({
  config: null as null | { providers: { authorize?: (c: unknown) => Promise<unknown> }[] },
  db: {
    user:    { findUnique: vi.fn() },
    account: { findFirst: vi.fn() },
  },
  bcryptOk: false,
}));

vi.mock("next-auth", () => {
  class CredentialsSignin extends Error { code = "credentials"; }
  return {
    default: (config: typeof h.config) => {
      if (config && "providers" in config) h.config = config;
      // `auth(handler)` no middleware devolve o próprio handler.
      return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: (fn: unknown) => fn };
    },
    CredentialsSignin,
  };
});
vi.mock("next-auth/providers/credentials", () => ({ default: (c: unknown) => c }));
vi.mock("next-auth/providers/google",      () => ({ default: () => ({ id: "google" }) }));
vi.mock("next-auth/providers/facebook",    () => ({ default: () => ({ id: "facebook" }) }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }));
vi.mock("@/lib/prisma", () => ({ prisma: { ...h.db, auditLog: { create: vi.fn().mockResolvedValue({}) } } }));
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn(async () => h.bcryptOk), hash: vi.fn() } }));

async function authorize(email: string, password = "Senha@123") {
  await import("@/lib/auth");
  const cred = h.config!.providers.find((p) => typeof p.authorize === "function")!;
  return cred.authorize!({ email, password });
}

beforeEach(() => {
  h.db.user.findUnique.mockReset();
  h.db.account.findFirst.mockReset();
  h.bcryptOk = false;
  (globalThis as Record<string, unknown>)["__rlBuckets"] = new Map();
});

describe("login (Credentials)", () => {
  it("e-mail sem cadastro → código email_senha_incorretos", async () => {
    h.db.user.findUnique.mockResolvedValue(null);
    await expect(authorize("a@a.com")).rejects.toMatchObject({ code: "email_senha_incorretos" });
  });

  it("e-mail cadastrado com senha errada → código senha_incorreta", async () => {
    h.db.user.findUnique.mockResolvedValue({ id: "u1", email: "a@a.com", active: true, role: "PATIENT" });
    h.db.account.findFirst.mockResolvedValue({ access_token: "$2a$12$hash" });
    await expect(authorize("a@a.com")).rejects.toMatchObject({ code: "senha_incorreta" });
  });

  it("6ª tentativa em 15 min → código login_bloqueado (AUTH_LOGIN_BLOQUEADO)", async () => {
    h.db.user.findUnique.mockResolvedValue(null);
    for (let i = 0; i < 5; i++) await authorize("bloq@a.com").catch(() => null);
    await expect(authorize("bloq@a.com")).rejects.toMatchObject({ code: "login_bloqueado" });
  });

  it("conta desativada com a senha certa → código conta_desativada", async () => {
    h.db.user.findUnique.mockResolvedValue({ id: "u1", email: "d@a.com", active: false, role: "PATIENT" });
    h.db.account.findFirst.mockResolvedValue({ access_token: "$2a$12$hash" });
    h.bcryptOk = true;
    await expect(authorize("d@a.com")).rejects.toMatchObject({ code: "conta_desativada" });
  });

  it("conta desativada com a senha ERRADA não revela a desativação", async () => {
    h.db.user.findUnique.mockResolvedValue({ id: "u1", email: "d@a.com", active: false, role: "PATIENT" });
    h.db.account.findFirst.mockResolvedValue({ access_token: "$2a$12$hash" });
    h.bcryptOk = false;
    await expect(authorize("d@a.com")).rejects.toMatchObject({ code: "senha_incorreta" });
  });

  it("os códigos viram mensagens do catálogo na tela", async () => {
    const { mensagemLogin } = await import("@/lib/auth-messages");
    expect(mensagemLogin("CredentialsSignin", "login_bloqueado")).toMatch(/15 minutos/);
    expect(mensagemLogin("CredentialsSignin", "conta_desativada")).toMatch(/desativada/);
    expect(mensagemLogin("CredentialsSignin", "credentials")).toBe("E-mail ou senha incorretos.");
    expect(mensagemLogin("CredentialsSignin", "senha_incorreta")).toBe("Senha incorreta.");
    expect(mensagemLogin("CredentialsSignin", "email_senha_incorretos")).toBe("E-mail e senha incorretos.");
    expect(mensagemLogin("GoogleSemEmail")).toMatch(/Google/);
  });
});

describe("middleware", () => {
  async function chamar(path: string, auth: unknown) {
    const { default: middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");
    const req = Object.assign(new NextRequest(`http://localhost${path}`), { auth });
    return (middleware as unknown as (r: unknown) => Response)(req);
  }

  it("API sem sessão → 401 JSON AUTH_SESSAO_EXPIRADA (antes 307 para HTML)", async () => {
    const res = await chamar("/api/consultations", null);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "AUTH_SESSAO_EXPIRADA" });
  });

  it("página sem sessão continua indo ao login", async () => {
    const res = await chamar("/dashboard/patient", null);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/login");
  });

  it("health check é público", async () => {
    const res = await chamar("/api/health", null);
    expect(res.status).not.toBe(401);
  });
});
