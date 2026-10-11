import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Peça que para: o LISTEN/NOTIFY do Postgres (lib/realtime.ts).
// Reação esperada: a ação do usuário (mensagem, receita, encerrar) já foi
// gravada, então publish NÃO pode lançar — a falha vai só para o log como
// INFRA_REALTIME_FALHOU e o polling do cliente entrega a atualização.

const connect = vi.fn();
const executeRaw = vi.fn();

vi.mock("pg", () => ({
  Client: class {
    connect = connect;
    on() { return this; }
    query = vi.fn().mockResolvedValue(undefined);
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: { $executeRawUnsafe: executeRaw } }));

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://teste");
  logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  connect.mockReset();
  executeRaw.mockReset();
  // Cada teste começa sem listener em cache.
  const g = globalThis as Record<string, unknown>;
  delete g["__pgListener"];
  delete g["__pgListenerInit"];
});
afterEach(() => { logSpy.mockRestore(); vi.unstubAllEnvs(); });

describe("publish com o Postgres LISTEN fora", () => {
  it("não lança e registra INFRA_REALTIME_FALHOU", async () => {
    connect.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const { publish } = await import("@/lib/realtime");
    await expect(publish({ channel: "consultation:abc", type: "message.new" })).resolves.toBeUndefined();
    expect(logSpy.mock.calls.flat().join(" ")).toContain("INFRA_REALTIME_FALHOU");
  });

  it("não envenena a instância: depois que o banco volta, publica normalmente", async () => {
    const { publish } = await import("@/lib/realtime");
    connect.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));
    await publish({ channel: "queue", type: "x" });
    expect(executeRaw).not.toHaveBeenCalled();

    connect.mockResolvedValue(undefined);
    executeRaw.mockResolvedValue(1);
    await publish({ channel: "queue", type: "x" });
    // Antes a promise rejeitada ficava em cache e todo publish seguinte falhava.
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });

  it("NOTIFY falhando depois de conectar também não lança", async () => {
    connect.mockResolvedValue(undefined);
    executeRaw.mockRejectedValue(new Error("terminating connection"));
    const { publish } = await import("@/lib/realtime");
    await expect(publish({ channel: "patient:1", type: "y" })).resolves.toBeUndefined();
  });
});
