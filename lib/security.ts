import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Rate limiter (in-memory, sliding window) ─────────────────────────────────
//
// Limitação: funciona por processo Node. Em deploy com múltiplas instâncias,
// cada instância tem seu próprio bucket. Para produção sob alta carga,
// trocar por Redis/Upstash. Para começar é suficiente.

interface Bucket { tokens: number; resetAt: number }

const globalForRl = globalThis as unknown as {
  __rlBuckets?: Map<string, Bucket>;
};

function buckets(): Map<string, Bucket> {
  if (!globalForRl.__rlBuckets) globalForRl.__rlBuckets = new Map();
  return globalForRl.__rlBuckets;
}

export interface RateLimitOptions {
  /** Identificador único: "rota:ip" ou "rota:userId". */
  key:        string;
  /** Quantas requisições no período. */
  limit:      number;
  /** Janela em segundos. */
  windowSec:  number;
}

export interface RateLimitResult {
  ok:           boolean;
  remaining:    number;
  resetSeconds: number;
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const map = buckets();
  const b = map.get(opts.key);

  // Cleanup oportunista (a cada chamada se vencido)
  if (!b || b.resetAt <= now) {
    const fresh: Bucket = { tokens: opts.limit - 1, resetAt: now + opts.windowSec * 1000 };
    map.set(opts.key, fresh);
    return { ok: true, remaining: fresh.tokens, resetSeconds: opts.windowSec };
  }

  if (b.tokens <= 0) {
    return { ok: false, remaining: 0, resetSeconds: Math.max(0, Math.round((b.resetAt - now) / 1000)) };
  }

  b.tokens -= 1;
  return { ok: true, remaining: b.tokens, resetSeconds: Math.max(0, Math.round((b.resetAt - now) / 1000)) };
}

/** Resposta padronizada quando rate-limit é atingido. */
export function tooManyRequests(reset = 60) {
  return NextResponse.json(
    { message: "Muitas requisições. Aguarde alguns segundos.", code: "RATE_LIMIT" },
    {
      status: 429,
      headers: {
        "Retry-After":           String(reset),
        "X-RateLimit-Reset":     String(reset),
      },
    },
  );
}

// ─── IP do cliente (atrás de proxy/Vercel) ────────────────────────────────────

export function getClientIp(req: NextRequest | Request): string {
  const headers = "headers" in req ? req.headers : new Headers();
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

// ─── Origin check (mitiga CSRF em rotas mutantes) ─────────────────────────────

function allowedOrigins(): Set<string> {
  const set = new Set<string>();
  const env = process.env["NEXT_PUBLIC_APP_URL"];
  if (env) set.add(env.replace(/\/$/, ""));
  // dev
  set.add("http://localhost:3000");
  set.add("http://127.0.0.1:3000");
  return set;
}

/**
 * Valida que a origem da requisição é confiável.
 * Retorna null se OK; ou Response 403 se rejeitada.
 */
export function checkOrigin(req: NextRequest | Request): NextResponse | null {
  const origin  = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Same-origin requests do app: o browser manda Origin no fetch.
  // GETs simples NextAuth não passam aqui (rotas de mutação só).
  if (!origin && !referer) {
    // Sem Origin nem Referer -> bloqueia (improvável em fetch normal)
    return NextResponse.json({ message: "Origem não verificável" }, { status: 403 });
  }

  const allowed = allowedOrigins();
  const candidate = origin ?? (referer ? new URL(referer).origin : "");

  if (!allowed.has(candidate.replace(/\/$/, ""))) {
    return NextResponse.json({ message: "Origem não autorizada" }, { status: 403 });
  }
  return null;
}

// ─── Helpers comuns para limites por rota ─────────────────────────────────────

export const RL = {
  login:        { limit: 5,   windowSec: 60 },        // 5/min por IP
  register:     { limit: 3,   windowSec: 60 * 5 },    // 3 a cada 5 min
  forgotPassword: { limit: 3, windowSec: 60 * 15 },   // 3 a cada 15 min por IP+email
  resetPassword:  { limit: 5, windowSec: 60 * 15 },   // 5 tentativas a cada 15 min
  queueEnter:   { limit: 5,   windowSec: 60 * 10 },   // 5 a cada 10 min
  queueClaim:   { limit: 30,  windowSec: 60 },        // 30/min (médico ativo)
  livekitToken: { limit: 60,  windowSec: 60 },        // 60/min
  message:      { limit: 60,  windowSec: 60 },        // 60/min
  attachment:   { limit: 30,  windowSec: 60 * 10 },   // 30/10min
  prontuario:   { limit: 120, windowSec: 60 },        // alto: auto-save
  generic:      { limit: 100, windowSec: 60 },
} as const;
