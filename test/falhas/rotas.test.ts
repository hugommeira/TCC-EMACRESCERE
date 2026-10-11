import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

// Rotas reais (app/api/**) com as peças críticas falhando. Sessão, banco e
// storage são mocks: nada aqui toca o banco de produção.

const h = vi.hoisted(() => ({
  session: { user: { id: "pac1", role: "PATIENT", name: "Paciente", email: "p@p.com" } } as unknown,
  db: {
    consultation: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    attachment:   { create: vi.fn() },
  } as Record<string, unknown>,
  putObject: vi.fn(),
  listPatientConsultations: vi.fn(),
  endConsultation: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => h.session) }));
vi.mock("@/lib/prisma", () => ({ prisma: h.db }));
vi.mock("@/lib/s3", () => ({
  buildKey: (parts: string[]) => parts.join("/"),
  putObject: h.putObject,
}));
vi.mock("@/services/api/consultation", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  listPatientConsultations: h.listPatientConsultations,
}));
vi.mock("@/services/api/queue", () => ({ endConsultation: h.endConsultation }));

const APP = "https://tcc-emacrescere.vercel.app";
const params = (id: string) => ({ params: { id } });

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", APP);
  logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  h.session = { user: { id: "pac1", role: "PATIENT", name: "Paciente", email: "p@p.com" } };
});
afterEach(() => { logSpy.mockRestore(); vi.unstubAllEnvs(); });

describe("banco de dados fora do ar", () => {
  it("GET /api/consultations → 503 INFRA_BANCO_INDISPONIVEL sem texto do Prisma", async () => {
    vi.stubEnv("NODE_ENV", "production");
    h.listPatientConsultations.mockRejectedValue(
      new Prisma.PrismaClientInitializationError("Can't reach database server at ep-xyz.neon.tech:5432", "5"),
    );
    const { GET } = await import("@/app/api/consultations/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://x/api/consultations"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("INFRA_BANCO_INDISPONIVEL");
    expect(JSON.stringify(body)).not.toMatch(/neon|Prisma|5432/);
  });
});

describe("requisições malformadas", () => {
  it("?status inexistente → 422 PARAMETRO_INVALIDO (antes 500 do Prisma)", async () => {
    const { GET } = await import("@/app/api/consultations/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://x/api/consultations?status=FOO"));
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: "PARAMETRO_INVALIDO" });
  });

  it("corpo JSON quebrado → 400 REQUISICAO_JSON_INVALIDO (antes 500)", async () => {
    const { POST } = await import("@/app/api/consultations/[id]/cancel/route");
    const req = new Request("http://x/api/consultations/c1/cancel", { method: "POST", body: "{quebrado" });
    const res = await POST(req as never, params("c1"));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "REQUISICAO_JSON_INVALIDO" });
  });

  it("papel errado é 403, não 401 (sessão não caiu)", async () => {
    h.session = { user: { id: "med1", role: "DOCTOR", name: "Dra", email: "d@d.com" } };
    const { POST } = await import("@/app/api/consultations/route");
    const res = await POST(new Request("http://x/api/consultations", { method: "POST", body: "{}" }) as never);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "AUTH_SEM_PERMISSAO" });
  });
});

describe("LiveKit sem configuração", () => {
  it("token da sala → 503 VIDEO_NAO_CONFIGURADO", async () => {
    vi.stubEnv("LIVEKIT_URL", "");
    vi.stubEnv("LIVEKIT_API_KEY", "");
    vi.stubEnv("LIVEKIT_API_SECRET", "");
    (h.db.consultation as { findUnique: ReturnType<typeof vi.fn> }).findUnique.mockResolvedValue({
      id: "c1", status: "IN_PROGRESS", patientId: "pac1", doctorId: "med1", livekitRoom: null,
    });
    const { GET } = await import("@/app/api/livekit/token/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://x/api/livekit/token?consultationId=c1"));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "VIDEO_NAO_CONFIGURADO" });
  });
});

describe("armazenamento de arquivos fora", () => {
  it("upload de anexo → 502 ARQUIVO_ARMAZENAMENTO_FALHOU sem o texto do storage", async () => {
    (h.db.consultation as { findUnique: ReturnType<typeof vi.fn> }).findUnique.mockResolvedValue({
      patientId: "pac1", doctorId: "med1", status: "IN_PROGRESS",
    });
    h.putObject.mockRejectedValue(new Error("S3 AccessDenied: bucket emacrescere-secret"));
    const fd = new FormData();
    fd.append("file", new File([new Uint8Array([37, 80, 68, 70])], "exame.pdf", { type: "application/pdf" }));
    fd.append("kind", "EXAME");
    const req = new Request("http://x/api/consultations/c1/attachments/upload", {
      method: "POST", body: fd, headers: { origin: APP },
    });
    const { POST } = await import("@/app/api/consultations/[id]/attachments/upload/route");
    const res = await POST(req as never, params("c1"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.code).toBe("ARQUIVO_ARMAZENAMENTO_FALHOU");
    expect(JSON.stringify(body)).not.toContain("bucket");
  });

  it("arquivo acima do limite → 413 ARQUIVO_MUITO_GRANDE", async () => {
    (h.db.consultation as { findUnique: ReturnType<typeof vi.fn> }).findUnique.mockResolvedValue({
      patientId: "pac1", doctorId: "med1", status: "IN_PROGRESS",
    });
    const fd = new FormData();
    fd.append("file", new File([new Uint8Array(4 * 1024 * 1024 + 1)], "grande.pdf", { type: "application/pdf" }));
    const req = new Request("http://x/api/consultations/c1/attachments/upload", {
      method: "POST", body: fd, headers: { origin: APP },
    });
    const { POST } = await import("@/app/api/consultations/[id]/attachments/upload/route");
    const res = await POST(req as never, params("c1"));
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ code: "ARQUIVO_MUITO_GRANDE" });
  });
});

describe("auditoria fora", () => {
  it("encerrar consulta funciona mesmo se o AuditLog não grava", async () => {
    h.session = { user: { id: "med1", role: "DOCTOR", name: "Dra", email: "d@d.com" } };
    h.endConsultation.mockResolvedValue({ id: "c1", status: "COMPLETED" });
    // h.db não tem auditLog: a gravação da auditoria lança.
    const { POST } = await import("@/app/api/consultations/[id]/end/route");
    const req = new Request("http://x/api/consultations/c1/end", { method: "POST", headers: { origin: APP } });
    const res = await POST(req, params("c1"));
    expect(res.status).toBe(200);
    expect(logSpy.mock.calls.flat().join(" ")).toContain("INFRA_AUDITORIA_FALHOU");
  });
});
