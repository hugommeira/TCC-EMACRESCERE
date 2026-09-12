import type { ClassValue } from "clsx";

// ─── Utility: merge class names ───────────────────────────────────────────────
// Implementação inline para não depender de clsx em produção.
// Troque por clsx + tailwind-merge se precisar de mais poder.
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .join(" ");
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style:    "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Fuso da plataforma. As páginas do dashboard são renderizadas no servidor
 * (Vercel roda em UTC): sem timeZone explícito, todo horário aparecia 3h
 * adiantado pro admin/médico.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day:      "2-digit",
    month:    "2-digit",
    year:     "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day:      "2-digit",
    month:    "2-digit",
    year:     "numeric",
    hour:     "2-digit",
    minute:   "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(date));
}

/** Início do dia de hoje no fuso da plataforma (pra "consultas de hoje"). */
export function startOfTodayInAppTimeZone(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  // Meia-noite local = meia-noite UTC + offset; o offset de SP é -03:00 o
  // ano todo (sem horário de verão desde 2019).
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), 3, 0, 0));
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
}

export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// ─── Validators ───────────────────────────────────────────────────────────────

export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]!) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9]!)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]!) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]!);
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

export function createSSEMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateRoomToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// ─── Nome de médico ───────────────────────────────────────────────────────────

const DOCTOR_PREFIX_RE = /^dr\.?a?\.?\s+/i;

/**
 * "Dr(a). Nome" — sem duplicar quando o nome cadastrado já vem com
 * "Dr."/"Dra." (ex.: o médico do seed é "Dr. João Silva", que virava
 * "Dr(a). Dr. João Silva" em todas as telas).
 */
export function doctorTitle(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return "";
  return DOCTOR_PREFIX_RE.test(n) ? n : `Dr(a). ${n}`;
}

/** Primeiro nome do médico, ignorando um "Dr."/"Dra." à frente. */
export function doctorFirstName(name: string | null | undefined): string {
  const n = (name ?? "").trim().replace(DOCTOR_PREFIX_RE, "");
  return n.split(/\s+/)[0] ?? n;
}

/** "Bom dia" / "Boa tarde" / "Boa noite" no fuso do app. */
export function greetingFor(date: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: APP_TIME_ZONE }).format(date),
  ) % 24;
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
