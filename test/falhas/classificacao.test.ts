import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { AppError, classifyError, toApiError } from "@/lib/errors";
import { apiError, enumParam, intParam, readJson, validationError } from "@/lib/api-response";
import { checkOrigin, tooManyRequests } from "@/lib/security";

// Todo erro que chega ao catch de uma rota vira { message, code, status } com
// um código do catálogo — inclusive os que antes viravam 500 cru.

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => { logSpy = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { logSpy.mockRestore(); vi.unstubAllEnvs(); });

function prismaKnown(code: string) {
  return new Prisma.PrismaClientKnownRequestError("detalhe interno do Prisma", { code, clientVersion: "5" });
}

describe("toApiError", () => {
  it("AppError usa mensagem e status do catálogo", () => {
    expect(toApiError(new AppError("AGENDA_HORARIO_OCUPADO"))).toEqual({
      message: "Esse horário acabou de ser ocupado. Escolha outro.",
      code:    "AGENDA_HORARIO_OCUPADO",
      status:  409,
    });
  });

  it("AppError aceita mensagem específica e erros de campo", () => {
    const r = toApiError(new AppError("USUARIO_CRM_INVALIDO", { message: "CRM 1234/SP não encontrado", errors: { crm: ["x"] } }));
    expect(r).toMatchObject({ code: "USUARIO_CRM_INVALIDO", status: 422, message: "CRM 1234/SP não encontrado", errors: { crm: ["x"] } });
  });

  it("JSON inválido (SyntaxError) → 400", () => {
    expect(toApiError(new SyntaxError("Unexpected end of JSON input"))).toMatchObject({ code: "REQUISICAO_JSON_INVALIDO", status: 400 });
  });

  it("zod → 422 com erros por campo", () => {
    const err = z.object({ email: z.string().email("E-mail inválido") }).safeParse({ email: "x" }).error!;
    expect(toApiError(err)).toMatchObject({ code: "DADOS_INVALIDOS", status: 422, errors: { email: ["E-mail inválido"] } });
  });

  it.each([
    ["P2002", "CONFLITO_DUPLICADO", 409],
    ["P2025", "NAO_ENCONTRADO",     404],
    ["P2003", "PARAMETRO_INVALIDO", 422],
    ["P1001", "INFRA_BANCO_INDISPONIVEL", 503],
    ["P2024", "INFRA_BANCO_INDISPONIVEL", 503],
  ])("Prisma %s → %s", (prismaCode, code, status) => {
    const r = toApiError(prismaKnown(prismaCode));
    expect(r).toMatchObject({ code, status });
    expect(r.message).not.toContain("Prisma");
  });

  it("banco inacessível (PrismaClientInitializationError) → 503", () => {
    const e = new Prisma.PrismaClientInitializationError("Can't reach database server at neon.tech", "5");
    expect(toApiError(e)).toMatchObject({ code: "INFRA_BANCO_INDISPONIVEL", status: 503 });
    // 5xx vai para o log com o código.
    expect(logSpy.mock.calls.flat().join(" ")).toContain("INFRA_BANCO_INDISPONIVEL");
  });

  it("erro desconhecido em produção não vaza a mensagem", () => {
    vi.stubEnv("NODE_ENV", "production");
    const r = toApiError(new Error("segredo: conexão postgres://user:senha@host"));
    expect(r).toMatchObject({ code: "ERRO_INTERNO", status: 500 });
    expect(r.message).not.toContain("senha");
  });

  it("classifyError devolve null para o que não conhece", () => {
    expect(classifyError(new Error("x"))).toBeNull();
  });
});

describe("helpers das rotas", () => {
  it("apiError monta a resposta padrão", async () => {
    const res = apiError("CONSULTA_NAO_ENCONTRADA");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Consulta não encontrada.", code: "CONSULTA_NAO_ENCONTRADA", status: 404 });
  });

  it("validationError devolve os campos do zod", async () => {
    const err = z.object({ n: z.number({ invalid_type_error: "Número" }) }).safeParse({ n: "a" }).error!;
    const res = validationError(err, "Dados de pagamento inválidos");
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: "DADOS_INVALIDOS", message: "Dados de pagamento inválidos", errors: { n: ["Número"] } });
  });

  it("readJson: corpo vazio ou malformado vira REQUISICAO_JSON_INVALIDO", async () => {
    const req = new Request("http://x/api", { method: "POST", body: "{nope" });
    await expect(readJson(req)).rejects.toMatchObject({ code: "REQUISICAO_JSON_INVALIDO" });
  });

  it("intParam e enumParam recusam valores inválidos (antes viravam 500 do Prisma)", () => {
    const sp = new URLSearchParams("page=abc&limit=999&status=FOO");
    expect(() => intParam(sp, "page", { default: 1 })).toThrow(AppError);
    expect(intParam(sp, "limit", { default: 10, max: 50 })).toBe(50);
    expect(intParam(new URLSearchParams(), "page", { default: 1 })).toBe(1);
    expect(() => enumParam(sp, "status", ["SCHEDULED", "COMPLETED"] as const)).toThrow(AppError);
    expect(enumParam(new URLSearchParams("status=SCHEDULED"), "status", ["SCHEDULED"] as const)).toBe("SCHEDULED");
  });

  it("429 com código e Retry-After", async () => {
    const res = tooManyRequests(42);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(await res.json()).toMatchObject({ code: "LIMITE_REQUISICOES" });
  });
});

describe("checkOrigin (proteção CSRF)", () => {
  it("Referer malformado é recusado com 403, sem derrubar a rota", async () => {
    const req = new Request("http://x/api", { method: "POST", headers: { referer: "::nao-e-url::" } });
    const res = checkOrigin(req);
    expect(res?.status).toBe(403);
    expect(await res!.json()).toMatchObject({ code: "ORIGEM_NAO_AUTORIZADA" });
  });

  it("sem Origin nem Referer → 403", () => {
    expect(checkOrigin(new Request("http://x/api", { method: "POST" }))?.status).toBe(403);
  });

  it("origem do próprio site passa", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tcc-emacrescere.vercel.app");
    const req = new Request("http://x/api", { method: "POST", headers: { origin: "https://tcc-emacrescere.vercel.app" } });
    expect(checkOrigin(req)).toBeNull();
  });
});
