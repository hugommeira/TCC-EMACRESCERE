import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

// Webhook do Asaas fora de ordem e health check com o banco fora do ar.
// Prisma 100% mockado: nada toca o banco real.

const db = vi.hoisted(() => ({
  payment: { findFirst: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  consultation: { findUnique: vi.fn() },
  $queryRawUnsafe: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  for (const fn of [db.payment.findFirst, db.payment.update, db.payment.findUnique, db.consultation.findUnique, db.$queryRawUnsafe]) fn.mockReset();
});
afterEach(() => logSpy.mockRestore());

describe("webhook do Asaas", () => {
  it("PENDING atrasado não rebaixa pagamento já confirmado", async () => {
    db.payment.findFirst.mockResolvedValue({ id: "p1", status: "CONFIRMED", consultationId: "c1" });
    const { processAsaasWebhook } = await import("@/services/api/payment");
    await processAsaasWebhook({ event: "PAYMENT_CREATED", payment: { id: "pay_1", status: "PENDING" } });
    expect(db.payment.update).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join(" ")).toContain("WEBHOOK_REGRESSAO_IGNORADA");
  });

  it("estorno de pagamento confirmado é aplicado", async () => {
    db.payment.findFirst.mockResolvedValue({ id: "p1", status: "RECEIVED", consultationId: "c1" });
    db.payment.update.mockResolvedValue({});
    const { processAsaasWebhook } = await import("@/services/api/payment");
    await processAsaasWebhook({ event: "PAYMENT_REFUNDED", payment: { id: "pay_1", status: "REFUNDED" } });
    expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "REFUNDED" }),
    }));
  });

  it("rota: token errado → 403 WEBHOOK_TOKEN_INVALIDO; sem token configurado → 500 (Asaas reenvia)", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "certo");
    const { POST } = await import("@/app/api/webhooks/asaas/route");
    const errado = new Request("http://x/api/webhooks/asaas", { method: "POST", headers: { "asaas-access-token": "errado" }, body: "{}" });
    const r1 = await POST(errado as never);
    expect(r1.status).toBe(403);
    expect(await r1.json()).toMatchObject({ code: "WEBHOOK_TOKEN_INVALIDO" });

    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "");
    const r2 = await POST(new Request("http://x/api/webhooks/asaas", { method: "POST", body: "{}" }) as never);
    expect(r2.status).toBe(500);
    expect(await r2.json()).toMatchObject({ code: "WEBHOOK_NAO_CONFIGURADO" });
    vi.unstubAllEnvs();
  });

  it("rota: banco fora durante o webhook → 503 (o Asaas reenvia depois)", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "certo");
    db.payment.findFirst.mockRejectedValue(new Prisma.PrismaClientInitializationError("Can't reach database server", "5"));
    const { POST } = await import("@/app/api/webhooks/asaas/route");
    const req = new Request("http://x/api/webhooks/asaas", {
      method: "POST",
      headers: { "asaas-access-token": "certo" },
      body: JSON.stringify({ event: "PAYMENT_RECEIVED", payment: { id: "pay_1", status: "RECEIVED" } }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "INFRA_BANCO_INDISPONIVEL" });
    vi.unstubAllEnvs();
  });
});

describe("health check", () => {
  it("banco fora → status fora e 503", async () => {
    db.$queryRawUnsafe.mockRejectedValue(new Prisma.PrismaClientInitializationError("Can't reach database server", "5"));
    const { checarSaude } = await import("@/lib/health");
    const saude = await checarSaude();
    expect(saude.status).toBe("fora");
    expect(saude.componentes.find((c) => c.id === "banco")).toMatchObject({ estado: "fora", code: "INFRA_BANCO_INDISPONIVEL" });

    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    // Sem login: só o estado geral, sem revelar a configuração.
    expect(Object.keys(await res.json()).sort()).toEqual(["status", "verificadoEm"]);
  });

  it("variáveis ausentes aparecem com o código que o usuário veria", async () => {
    db.$queryRawUnsafe.mockResolvedValue([{ "?column?": 1 }]);
    vi.stubEnv("LIVEKIT_URL", "");
    vi.stubEnv("PFX_ENCRYPTION_KEY", "curta");
    const { checarSaude } = await import("@/lib/health");
    const saude = await checarSaude();
    expect(saude.status).toBe("degradado");
    expect(saude.componentes.find((c) => c.id === "video")).toMatchObject({ estado: "fora", code: "VIDEO_NAO_CONFIGURADO" });
    expect(saude.componentes.find((c) => c.id === "certificado")).toMatchObject({ estado: "fora", code: "CERTIFICADO_CHAVE_SERVIDOR" });
    vi.unstubAllEnvs();
  });
});
