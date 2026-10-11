import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAsaasCustomer } from "@/services/external/asaas";
import { sendPasswordResetEmail } from "@/services/external/email";
import { createRoomToken, livekitUrl } from "@/lib/livekit";
import { decrypt, encrypt } from "@/lib/crypto";

// "E se um serviço externo parar?" — cada falha vira um código do catálogo,
// nunca um 500 com o texto do fetch ou da criptografia.

const CLIENTE = { name: "Teste", email: "t@t.com", cpfCnpj: "00000000000" };
const KEY_A = "a".repeat(64);
const KEY_B = "b".repeat(64);

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => { logSpy = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => {
  logSpy.mockRestore();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("Asaas (pagamentos)", () => {
  beforeEach(() => vi.stubEnv("ASAAS_API_KEY", "chave-de-teste"));

  it("rede caiu → PAGAMENTO_GATEWAY_INDISPONIVEL (nada cobrado)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(createAsaasCustomer(CLIENTE)).rejects.toMatchObject({ code: "PAGAMENTO_GATEWAY_INDISPONIVEL", status: 503 });
  });

  it("timeout (AbortSignal.timeout) → PAGAMENTO_GATEWAY_INDISPONIVEL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("The operation timed out", "TimeoutError")));
    await expect(createAsaasCustomer(CLIENTE)).rejects.toMatchObject({ code: "PAGAMENTO_GATEWAY_INDISPONIVEL" });
  });

  it("a requisição sai com tempo limite", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { id: "cus_1" }));
    vi.stubGlobal("fetch", fetchMock);
    await createAsaasCustomer(CLIENTE);
    expect(fetchMock.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal);
  });

  it("Asaas fora do ar (5xx) → PAGAMENTO_GATEWAY_INDISPONIVEL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 })));
    await expect(createAsaasCustomer(CLIENTE)).rejects.toMatchObject({ code: "PAGAMENTO_GATEWAY_INDISPONIVEL" });
  });

  it("chave recusada (401) → PAGAMENTO_GATEWAY_NAO_CONFIGURADO", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));
    await expect(createAsaasCustomer(CLIENTE)).rejects.toMatchObject({ code: "PAGAMENTO_GATEWAY_NAO_CONFIGURADO" });
  });

  it("chave ausente → PAGAMENTO_GATEWAY_NAO_CONFIGURADO, sem chamar o Asaas", async () => {
    vi.stubEnv("ASAAS_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(createAsaasCustomer(CLIENTE)).rejects.toMatchObject({ code: "PAGAMENTO_GATEWAY_NAO_CONFIGURADO" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa de negócio (400) → PAGAMENTO_RECUSADO com o motivo do Asaas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(400, { errors: [{ description: "CPF inválido" }] })));
    await expect(createAsaasCustomer(CLIENTE)).rejects.toMatchObject({
      code:    "PAGAMENTO_RECUSADO",
      status:  402,
      message: "Pagamento recusado: CPF inválido",
    });
  });
});

describe("Resend (e-mail)", () => {
  it("sem chave: não envia, não quebra o fluxo e registra INFRA_EMAIL_NAO_CONFIGURADO", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendPasswordResetEmail("a@b.com", "https://x/reset")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join(" ")).toContain("INFRA_EMAIL_NAO_CONFIGURADO");
  });

  it("Resend recusa (500) → AUTH_EMAIL_NAO_ENVIADO", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_teste");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(500, { message: "down" })));
    await expect(sendPasswordResetEmail("a@b.com", "https://x/reset")).rejects.toMatchObject({ code: "AUTH_EMAIL_NAO_ENVIADO" });
  });

  it("Resend inacessível → AUTH_EMAIL_NAO_ENVIADO", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_teste");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(sendPasswordResetEmail("a@b.com", "https://x/reset")).rejects.toMatchObject({ code: "AUTH_EMAIL_NAO_ENVIADO" });
  });
});

describe("LiveKit (vídeo)", () => {
  it("variáveis ausentes → VIDEO_NAO_CONFIGURADO (503), não 500", async () => {
    vi.stubEnv("LIVEKIT_URL", "");
    vi.stubEnv("LIVEKIT_API_KEY", "");
    vi.stubEnv("LIVEKIT_API_SECRET", "");
    expect(() => livekitUrl()).toThrow(expect.objectContaining({ code: "VIDEO_NAO_CONFIGURADO", status: 503 }));
    await expect(createRoomToken({ identity: "u", name: "U", role: "PATIENT", roomName: "r" }))
      .rejects.toMatchObject({ code: "VIDEO_NAO_CONFIGURADO" });
  });
});

describe("Chave dos certificados (PFX_ENCRYPTION_KEY)", () => {
  it("ausente → CERTIFICADO_CHAVE_SERVIDOR", () => {
    vi.stubEnv("PFX_ENCRYPTION_KEY", "");
    expect(() => encrypt("senha")).toThrow(expect.objectContaining({ code: "CERTIFICADO_CHAVE_SERVIDOR", status: 503 }));
  });

  it("tamanho errado → CERTIFICADO_CHAVE_SERVIDOR", () => {
    vi.stubEnv("PFX_ENCRYPTION_KEY", "abc123");
    expect(() => encrypt("senha")).toThrow(expect.objectContaining({ code: "CERTIFICADO_CHAVE_SERVIDOR" }));
  });

  it("chave trocada: dado cifrado com a antiga não abre → CERTIFICADO_CHAVE_SERVIDOR", () => {
    vi.stubEnv("PFX_ENCRYPTION_KEY", KEY_A);
    const cifrado = encrypt("senha do pfx");
    expect(decrypt(cifrado)).toBe("senha do pfx");
    vi.stubEnv("PFX_ENCRYPTION_KEY", KEY_B);
    expect(() => decrypt(cifrado)).toThrow(expect.objectContaining({ code: "CERTIFICADO_CHAVE_SERVIDOR" }));
  });

  it("dado corrompido → CERTIFICADO_CHAVE_SERVIDOR", () => {
    vi.stubEnv("PFX_ENCRYPTION_KEY", KEY_A);
    expect(() => decrypt("isso-nao-e-um-cifrado")).toThrow(expect.objectContaining({ code: "CERTIFICADO_CHAVE_SERVIDOR" }));
  });
});
