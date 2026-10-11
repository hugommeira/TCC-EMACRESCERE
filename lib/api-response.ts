import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { ERROS, type ErrorCode } from "@/lib/error-catalog";
import { AppError, toApiError } from "@/lib/errors";

// ─── Respostas de erro padronizadas para as rotas (app/api/**) ───────────────
//
// Corpo sempre no formato { message, code, status, errors? }.

export interface ApiErrorOverrides {
  message?: string | undefined;
  errors?:  Record<string, string[] | undefined> | undefined;
  headers?: Record<string, string> | undefined;
}

/** Resposta de erro a partir de um código do catálogo. */
export function apiError(code: ErrorCode, overrides: ApiErrorOverrides = {}): NextResponse {
  const def = ERROS[code];
  const body: Record<string, unknown> = {
    message: overrides.message ?? def.mensagem,
    code,
    status:  def.status,
  };
  if (overrides.errors) body["errors"] = overrides.errors;
  return NextResponse.json(body, overrides.headers ? { status: def.status, headers: overrides.headers } : { status: def.status });
}

/** 422 com os erros por campo do zod. */
export function validationError(error: ZodError, message?: string): NextResponse {
  return apiError("DADOS_INVALIDOS", { message, errors: error.flatten().fieldErrors });
}

/** `catch` padrão das rotas: converte qualquer erro em resposta JSON. */
export function handleRouteError(error: unknown): NextResponse {
  const err = toApiError(error);
  return NextResponse.json(err, { status: err.status });
}

/**
 * Lê o corpo JSON; corpo vazio ou malformado vira REQUISICAO_JSON_INVALIDO (400).
 * Tipo padrão `any`, igual ao de req.json(): quem valida o formato é o zod.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson<T = any>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch (e) {
    throw new AppError("REQUISICAO_JSON_INVALIDO", { detail: (e as Error)?.message });
  }
}

/** Lê multipart/form-data; corpo inválido vira REQUISICAO_JSON_INVALIDO (400). */
export async function readFormData(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch (e) {
    throw new AppError("REQUISICAO_JSON_INVALIDO", {
      message: "Não foi possível ler o arquivo enviado.",
      detail:  (e as Error)?.message,
    });
  }
}

// ─── Parâmetros de query ──────────────────────────────────────────────────────

/** Inteiro da query string (com default e limites); texto inválido → PARAMETRO_INVALIDO. */
export function intParam(
  sp: URLSearchParams,
  name: string,
  opts: { default: number; min?: number; max?: number },
): number {
  const raw = sp.get(name);
  if (raw === null || raw === "") return opts.default;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new AppError("PARAMETRO_INVALIDO", { message: `Parâmetro "${name}" deve ser um número inteiro.` });
  }
  const min = opts.min ?? Number.MIN_SAFE_INTEGER;
  const max = opts.max ?? Number.MAX_SAFE_INTEGER;
  return Math.min(max, Math.max(min, n));
}

/** Valor de enum da query string; ausente → undefined; fora da lista → PARAMETRO_INVALIDO. */
export function enumParam<T extends string>(
  sp: URLSearchParams,
  name: string,
  values: readonly T[],
): T | undefined {
  const raw = sp.get(name);
  if (raw === null || raw === "") return undefined;
  if (!(values as readonly string[]).includes(raw)) {
    throw new AppError("PARAMETRO_INVALIDO", { message: `Parâmetro "${name}" inválido.` });
  }
  return raw as T;
}
