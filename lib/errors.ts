import { ZodError } from "zod";
import { ERROS, isErrorCode, type ErrorCode } from "@/lib/error-catalog";

// ─── Erros de domínio ─────────────────────────────────────────────────────────
//
// Todo erro esperado é um AppError com um código do catálogo
// (lib/error-catalog.ts). A mensagem e o status vêm do catálogo; `message`
// só é passado quando o texto precisa de um detalhe (ex.: recusa do Asaas).

export interface AppErrorOptions {
  /** Substitui a mensagem padrão do catálogo. */
  message?: string | undefined;
  /** Erros por campo (formulários). */
  errors?:  Record<string, string[] | undefined> | undefined;
  /** Detalhe técnico: vai para o log, nunca para o usuário. */
  detail?:  string | undefined;
  cause?:   unknown;
}

export class AppError extends Error {
  public readonly code:   ErrorCode;
  public readonly status: number;
  public readonly errors?: Record<string, string[] | undefined> | undefined;
  public readonly detail?: string | undefined;

  constructor(code: ErrorCode, opts: AppErrorOptions = {}) {
    const def = ERROS[code];
    super(opts.message ?? def.mensagem);
    this.name   = "AppError";
    this.code   = code;
    this.status = def.status;
    this.errors = opts.errors;
    this.detail = opts.detail;
    if (opts.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause;
  }
}

// Classes antigas, mantidas para compatibilidade. Preferir `new AppError(code)`.

export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super("AUTH_SESSAO_EXPIRADA", { message });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super("AUTH_SEM_PERMISSAO", { message });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity = "Registro") {
    super("NAO_ENCONTRADO", { message: `${entity} não encontrado` });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message?: string) {
    super("CONSULTA_ESTADO_INVALIDO", { message: message ?? "Conflito de dados" });
    this.name = "ConflictError";
  }
}

export class PaymentError extends AppError {
  constructor(message?: string) {
    super("PAGAMENTO_RECUSADO", { message });
    this.name = "PaymentError";
  }
}

// ─── Classificação de erros não-AppError ──────────────────────────────────────

interface PrismaLike { name?: string; code?: string; message?: string }

/** Converte erros conhecidos (JSON, zod, Prisma) em AppError; null se não reconhecer. */
export function classifyError(error: unknown): AppError | null {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return new AppError("DADOS_INVALIDOS", { errors: error.flatten().fieldErrors });
  }

  if (error instanceof SyntaxError) {
    return new AppError("REQUISICAO_JSON_INVALIDO", { detail: error.message });
  }

  const e = (error ?? {}) as PrismaLike;
  const name = e.name ?? "";

  if (name === "PrismaClientInitializationError" || name === "PrismaClientRustPanicError") {
    return new AppError("INFRA_BANCO_INDISPONIVEL", { detail: e.message });
  }

  if (name === "PrismaClientKnownRequestError" && typeof e.code === "string") {
    switch (e.code) {
      case "P2002": return new AppError("CONFLITO_DUPLICADO", { detail: e.message });
      case "P2025": return new AppError("NAO_ENCONTRADO",     { detail: e.message });
      case "P2003": return new AppError("PARAMETRO_INVALIDO", { detail: e.message });
      // Conexão: servidor inacessível, timeout, conexão fechada, pool esgotado.
      case "P1001":
      case "P1002":
      case "P1008":
      case "P1017":
      case "P2024":
        return new AppError("INFRA_BANCO_INDISPONIVEL", { detail: e.message });
    }
  }

  if (name === "PrismaClientValidationError") {
    return new AppError("PARAMETRO_INVALIDO", { detail: e.message });
  }

  return null;
}

// ─── Helper: transformar erro em resposta API ─────────────────────────────────

export interface ApiErrorBody {
  message: string;
  code:    ErrorCode;
  status:  number;
  errors?: Record<string, string[] | undefined>;
}

export function toApiError(error: unknown): ApiErrorBody {
  const known = classifyError(error);
  if (known) {
    const body: ApiErrorBody = { message: known.message, code: known.code, status: known.status };
    if (known.errors) body.errors = known.errors;
    if (known.status >= 500) logError(known.code, error);
    return body;
  }

  // Em produção, NUNCA vazar mensagens nativas (Prisma, runtime, etc).
  const isDev = process.env["NODE_ENV"] !== "production";
  logError("ERRO_INTERNO", error);

  return {
    message: isDev && error instanceof Error ? error.message : ERROS.ERRO_INTERNO.mensagem,
    code:    "ERRO_INTERNO",
    status:  500,
  };
}

// ─── Log estruturado ──────────────────────────────────────────────────────────
//
// Uma linha JSON por erro, pesquisável nos logs da Vercel pelo `code`.

export function logError(code: ErrorCode | string, error?: unknown, extra?: Record<string, unknown>): void {
  const err = error as { message?: string; stack?: string; detail?: string } | undefined;
  const def = isErrorCode(code) ? ERROS[code] : undefined;
  console.error(JSON.stringify({
    nivel:      def?.severidade ?? "erro",
    code,
    mensagem:   err?.message,
    detalhe:    err?.detail,
    stack:      err?.stack?.split("\n").slice(0, 6).join("\n"),
    ...extra,
  }));
}
