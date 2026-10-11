import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiFetch,
  apiFetchBlob,
  mensagemComCampo,
  mensagemDeErro,
  observarConexao,
} from "@/lib/api-client";

// Cliente HTTP do site: cada jeito de uma chamada falhar vira ApiError com
// código do catálogo e mensagem amigável — nunca "Failed to fetch" ou JSON cru.

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("apiFetch", () => {
  it("devolve o JSON em caso de sucesso e manda o corpo como JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { data: { id: "1" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiFetch("/api/x", { method: "POST", body: { a: 1 } })).resolves.toEqual({ data: { id: "1" } });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.body).toBe('{"a":1}');
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("rede caiu → REDE_SEM_CONEXAO, sem 'Failed to fetch'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("REDE_SEM_CONEXAO");
    expect(mensagemDeErro(err)).not.toContain("fetch");
  });

  it("servidor não responde no tempo → REDE_TEMPO_ESGOTADO", async () => {
    vi.stubGlobal("fetch", vi.fn((_u: string, init: RequestInit) => new Promise((_, reject) => {
      init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    })));
    await expect(apiFetch("/api/x", { timeoutMs: 20 })).rejects.toMatchObject({ code: "REDE_TEMPO_ESGOTADO" });
  });

  it("página HTML de erro da Vercel (504) → SERVIDOR_RESPOSTA_INVALIDA", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>504 Gateway Timeout</html>", { status: 504 })));
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err.code).toBe("SERVIDOR_RESPOSTA_INVALIDA");
    expect(err.message).not.toContain("<html>");
  });

  it("413 da plataforma sem JSON → ARQUIVO_MUITO_GRANDE", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Request Entity Too Large", { status: 413 })));
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ code: "ARQUIVO_MUITO_GRANDE" });
  });

  it("erro do catálogo: usa code, message e erros por campo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(422, {
      code: "DADOS_INVALIDOS", message: "Alguns campos estão inválidos.", errors: { weightKg: ["O peso deve ser maior que 20 kg"] },
    })));
    const err = await apiFetch("/api/weight").catch((e) => e);
    expect(err.code).toBe("DADOS_INVALIDOS");
    expect(err.campo("weightKg")).toBe("O peso deve ser maior que 20 kg");
    expect(mensagemComCampo(err)).toBe("O peso deve ser maior que 20 kg");
  });

  it("429 informa quanto esperar (Retry-After)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(429, { code: "LIMITE_REQUISICOES", message: "Muitas tentativas." }, { "Retry-After": "30" })));
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err.retryAfter).toBe(30);
    expect(mensagemDeErro(err)).toBe("Muitas tentativas. Tente de novo em 30 segundos.");
  });

  it("401 leva ao login guardando a página atual", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/dashboard/patient/peso", search: "?x=1", assign } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(401, { code: "AUTH_SESSAO_EXPIRADA", message: "Sua sessão expirou." })));
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ code: "AUTH_SESSAO_EXPIRADA" });
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/auth/login?callbackUrl=%2Fdashboard%2Fpatient%2Fpeso%3Fx%3D1"));
  });

  it("falhas seguidas acendem o aviso de conexão; uma resposta apaga", async () => {
    const vistos: number[] = [];
    const parar = observarConexao((n) => vistos.push(n));
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    for (let i = 0; i < 3; i++) await apiFetch("/api/poll").catch(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(200, {})));
    await apiFetch("/api/poll");
    parar();
    expect(vistos).toEqual([0, 1, 2, 3, 0]);
  });
});

describe("apiFetchBlob (PDF)", () => {
  it("erro em JSON vira ApiError em vez de aparecer cru no visualizador", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(409, { code: "RECEITA_NAO_EMITIDA", message: "A receita ainda não foi emitida." })));
    await expect(apiFetchBlob("/api/prescriptions/1/pdf")).rejects.toMatchObject({ code: "RECEITA_NAO_EMITIDA" });
  });

  it("sucesso devolve o arquivo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array([37, 80, 68, 70]), { status: 200 })));
    const blob = await apiFetchBlob("/api/prescriptions/1/pdf");
    expect(blob.size).toBe(4);
  });
});
