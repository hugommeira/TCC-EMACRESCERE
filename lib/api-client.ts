import { ERROS, isErrorCode, mensagemDoCodigo, type ErrorCode } from "@/lib/error-catalog";

// ─── Cliente HTTP do site (navegador) ─────────────────────────────────────────
//
// Toda chamada à API passa por apiFetch: erro sempre vira ApiError com um
// código do catálogo (lib/error-catalog.ts), e o usuário nunca vê texto
// técnico ("Failed to fetch", JSON cru, "HTTP 413").

export class ApiError extends Error {
  readonly code:        ErrorCode;
  readonly status:      number;
  readonly fieldErrors: Record<string, string[] | undefined>;
  readonly retryAfter:  number | null;

  constructor(code: ErrorCode, opts: {
    message?:     string | undefined;
    status?:      number | undefined;
    fieldErrors?: Record<string, string[] | undefined> | undefined;
    retryAfter?:  number | null | undefined;
  } = {}) {
    super(opts.message || ERROS[code].mensagem || ERROS.ERRO_INTERNO.mensagem);
    this.name        = "ApiError";
    this.code        = code;
    this.status      = opts.status ?? ERROS[code].status;
    this.fieldErrors = opts.fieldErrors ?? {};
    this.retryAfter  = opts.retryAfter ?? null;
  }

  /** Primeira mensagem de um campo (formulários). */
  campo(nome: string): string | undefined {
    return this.fieldErrors[nome]?.[0];
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Objeto vira JSON; FormData/string/Blob vão como estão. */
  body?:       unknown;
  /** Tempo máximo de espera (padrão 30 s). */
  timeoutMs?:  number;
  /** Em 401, leva ao login guardando a página atual (padrão true). */
  redirectOn401?: boolean;
}

const DEFAULT_TIMEOUT_MS = 30_000;

// ─── Saúde da conexão (alimenta o ConnectionBanner) ──────────────────────────

type Listener = (falhasSeguidas: number) => void;
const listeners = new Set<Listener>();
let falhasSeguidas = 0;

function notificar() { listeners.forEach((l) => l(falhasSeguidas)); }

/** Registra uma falha de rede (fetch rejeitado ou timeout). */
export function registrarFalhaDeRede() { falhasSeguidas += 1; notificar(); }
/** Registra uma resposta do servidor (qualquer status). */
export function registrarSucessoDeRede() {
  if (falhasSeguidas !== 0) { falhasSeguidas = 0; notificar(); }
}
export function observarConexao(l: Listener): () => void {
  listeners.add(l);
  l(falhasSeguidas);
  return () => { listeners.delete(l); };
}

// ─── apiFetch ─────────────────────────────────────────────────────────────────

function irParaLogin() {
  if (typeof window === "undefined") return;
  const atual = window.location.pathname + window.location.search;
  if (window.location.pathname.startsWith("/auth/")) return;
  window.location.assign(`/auth/login?callbackUrl=${encodeURIComponent(atual)}&expirou=1`);
}

/**
 * fetch com tratamento padronizado. Devolve o JSON da resposta (ou null se
 * vazia) e lança ApiError em qualquer falha.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(url: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS, redirectOn401 = true, headers, signal, ...rest } = opts;

  const init: RequestInit = { ...rest };
  const h = new Headers(headers);
  if (body !== undefined) {
    if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
      init.body = body as BodyInit;
    } else {
      init.body = JSON.stringify(body);
      if (!h.has("Content-Type")) h.set("Content-Type", "application/json");
    }
  }
  init.headers = h;

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), timeoutMs);
  const onAbort = () => timeout.abort();
  signal?.addEventListener("abort", onAbort);
  init.signal = timeout.signal;

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    // Cancelado por quem chamou (ex.: componente desmontado): repassa como está.
    if (signal?.aborted) throw err;
    registrarFalhaDeRede();
    if (timeout.signal.aborted) throw new ApiError("REDE_TEMPO_ESGOTADO");
    throw new ApiError("REDE_SEM_CONEXAO");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  registrarSucessoDeRede();

  const texto = await res.text().catch(() => "");
  let data: unknown = null;
  let jsonOk = true;
  if (texto) {
    try { data = JSON.parse(texto); } catch { jsonOk = false; }
  }

  if (res.ok) {
    if (!jsonOk) throw new ApiError("SERVIDOR_RESPOSTA_INVALIDA", { status: res.status });
    return data as T;
  }

  // Erro: corpo esperado { message, code, errors? }.
  const corpo = (jsonOk && data && typeof data === "object" ? data : {}) as {
    message?: string; code?: string; errors?: Record<string, string[] | undefined>;
  };
  const retryHeader = res.headers.get("Retry-After");
  const retryAfter  = retryHeader ? Number(retryHeader) || null : null;

  let code: ErrorCode;
  if (isErrorCode(corpo.code)) code = corpo.code;
  else if (res.status === 401) code = "AUTH_SESSAO_EXPIRADA";
  else if (res.status === 403) code = "AUTH_SEM_PERMISSAO";
  else if (res.status === 404) code = "NAO_ENCONTRADO";
  else if (res.status === 413) code = "ARQUIVO_MUITO_GRANDE";
  else if (res.status === 429) code = "LIMITE_REQUISICOES";
  else if (res.status === 422) code = "DADOS_INVALIDOS";
  else if (!jsonOk || res.status === 502 || res.status === 504) code = "SERVIDOR_RESPOSTA_INVALIDA";
  else code = "ERRO_INTERNO";

  if (code === "AUTH_SESSAO_EXPIRADA" && redirectOn401) irParaLogin();

  // Mensagem do servidor só quando veio no formato do catálogo (já é amigável).
  const message = jsonOk && corpo.message ? corpo.message : undefined;
  throw new ApiError(code, { message, status: res.status, fieldErrors: corpo.errors, retryAfter });
}

/**
 * Baixa um arquivo (PDF, anexo). Erro do servidor vem em JSON e vira ApiError,
 * em vez de aparecer cru dentro de um iframe ou ser salvo como "arquivo".
 */
export async function apiFetchBlob(url: string, opts: { timeoutMs?: number } = {}): Promise<Blob> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), opts.timeoutMs ?? 60_000);
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", signal: timeout.signal });
  } catch {
    registrarFalhaDeRede();
    throw new ApiError(timeout.signal.aborted ? "REDE_TEMPO_ESGOTADO" : "REDE_SEM_CONEXAO");
  } finally {
    clearTimeout(timer);
  }
  registrarSucessoDeRede();
  if (res.ok) return res.blob();

  const corpo = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
  const code: ErrorCode = isErrorCode(corpo.code)
    ? corpo.code
    : res.status === 401 ? "AUTH_SESSAO_EXPIRADA" : res.status === 404 ? "ARQUIVO_NAO_ENCONTRADO" : "SERVIDOR_RESPOSTA_INVALIDA";
  if (code === "AUTH_SESSAO_EXPIRADA") irParaLogin();
  throw new ApiError(code, { message: corpo.message, status: res.status });
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

/** Texto para mostrar ao usuário a partir de qualquer erro. Nunca devolve texto técnico. */
export function mensagemDeErro(err: unknown, fallback?: string): string {
  if (err instanceof ApiError) {
    if (err.code === "LIMITE_REQUISICOES" && err.retryAfter) {
      const min = Math.ceil(err.retryAfter / 60);
      return err.retryAfter > 90
        ? `${err.message} Tente de novo em ${min} minutos.`
        : `${err.message} Tente de novo em ${err.retryAfter} segundos.`;
    }
    return err.message;
  }
  return fallback ?? mensagemDoCodigo("ERRO_INTERNO");
}

/** Como mensagemDeErro, mas prefere o primeiro erro de campo (ex.: "O peso deve ser maior que 20 kg"). */
export function mensagemComCampo(err: unknown, fallback?: string): string {
  if (err instanceof ApiError) {
    const campo = Object.values(err.fieldErrors).flat().find(Boolean);
    if (campo) return campo;
  }
  return mensagemDeErro(err, fallback);
}

export function codigoDoErro(err: unknown): ErrorCode | undefined {
  return err instanceof ApiError ? err.code : undefined;
}
