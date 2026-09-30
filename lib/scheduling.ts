// ─── Regras de horário do agendamento ─────────────────────────────────────────
//
// Funções puras (sem banco) pra montar os horários que um médico oferece num
// dia. Ficam separadas do Prisma pra poderem ser testadas e usadas tanto na
// API de disponibilidade quanto na validação do agendamento.
//
// Fuso: tudo é interpretado em America/Sao_Paulo. O Brasil não tem horário de
// verão desde 2019, então o deslocamento é fixo em -03:00 — o que deixa a
// conversão data+hora local -> instante UTC trivial e sem dependência externa.

export const SLOT_MINUTES = 60;

/**
 * Por quanto tempo uma consulta criada e ainda não paga segura o horário.
 * Antes, quem desistia na tela de pagamento travava aquele horário do médico
 * pra sempre (a checagem de conflito contava qualquer consulta não cancelada).
 */
export const UNPAID_HOLD_MINUTES = 30;

/**
 * Antecedência mínima pra agendar. Dá tempo do pagamento (Pix) compensar e do
 * médico ver a consulta na agenda antes do horário.
 */
export const MIN_LEAD_MINUTES = 60;

/** Agenda usada quando o médico nunca configurou a dele (availableHours = {}). */
export const DEFAULT_WEEK_HOURS: WeekHours = {
  mon: ["08:00", "18:00"],
  tue: ["08:00", "18:00"],
  wed: ["08:00", "18:00"],
  thu: ["08:00", "18:00"],
  fri: ["08:00", "18:00"],
  sat: [],
  sun: [],
};

const SP_OFFSET = "-03:00";
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type DayKey = (typeof DAY_KEYS)[number];
export type WeekHours = Partial<Record<DayKey, string[]>>;

export function isValidDateString(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const d = new Date(`${date}T12:00:00${SP_OFFSET}`);
  // Meio-dia de SP = 15h UTC do mesmo dia; "2026-02-31" rola pra março e falha.
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

/** Instante UTC de um horário local de São Paulo ("2026-10-05", "09:00"). */
export function toInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${SP_OFFSET}`);
}

/** Dia da semana (chave de availableHours) de uma data local de São Paulo. */
export function dayKeyOf(date: string): DayKey {
  // Meio-dia local cai no mesmo dia em UTC, então getUTCDay é seguro.
  return DAY_KEYS[new Date(`${date}T12:00:00${SP_OFFSET}`).getUTCDay()]!;
}

/** "YYYY-MM-DD" de hoje em São Paulo (independe do fuso do servidor). */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

/**
 * Normaliza o availableHours vindo do banco (Json). Objeto vazio ou inválido
 * -> agenda padrão, pra médico recém-cadastrado não ficar sem horário nenhum.
 */
export function normalizeWeekHours(raw: unknown): WeekHours {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_WEEK_HOURS;
  const out: WeekHours = {};
  let any = false;
  for (const key of DAY_KEYS) {
    const v = (raw as Record<string, unknown>)[key];
    if (Array.isArray(v) && v.length === 2 && v.every((t) => typeof t === "string" && TIME_RE.test(t))) {
      out[key] = [v[0] as string, v[1] as string];
      any = true;
    } else if (Array.isArray(v) && v.length === 0) {
      out[key] = [];
      any = true;
    }
  }
  return any ? out : DEFAULT_WEEK_HOURS;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Horários de início ("HH:MM") que o médico oferece nessa data. */
export function slotsForDate(hours: WeekHours, date: string): string[] {
  const range = hours[dayKeyOf(date)];
  if (!range || range.length !== 2) return [];
  const start = toMinutes(range[0]!);
  const end   = toMinutes(range[1]!);
  const out: string[] = [];
  // Só entra o horário que termina dentro do expediente.
  for (let t = start; t + SLOT_MINUTES <= end; t += SLOT_MINUTES) out.push(fromMinutes(t));
  return out;
}

/** O instante bate exatamente com um dos horários oferecidos no dia? */
export function isOfferedSlot(hours: WeekHours, instant: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const time = `${get("hour")}:${get("minute")}`;
  if (instant.getUTCSeconds() !== 0 || instant.getUTCMilliseconds() !== 0) return false;
  return slotsForDate(hours, date).includes(time);
}
