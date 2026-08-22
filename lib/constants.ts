// ─── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Emacrescere";
export const APP_URL  = process.env.NEXT_PUBLIC_APP_URL  ?? "http://localhost:3000";

// ─── Paginação padrão ─────────────────────────────────────────────────────────
export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT     = 100;

// ─── Pagamentos ───────────────────────────────────────────────────────────────
export const MIN_CONSULTATION_FEE = 50;   // R$ 50,00
export const MAX_CONSULTATION_FEE = 2000; // R$ 2.000,00

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const MAX_MESSAGE_LENGTH    = 2000;
export const CHAT_HISTORY_LIMIT    = 100;
export const SSE_KEEPALIVE_INTERVAL = 30_000; // 30s

// ─── Prescrição ───────────────────────────────────────────────────────────────
export const PRESCRIPTION_VALIDITY_DAYS = 30;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 dias em segundos

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLE_LABELS = {
  PATIENT:    "Paciente",
  DOCTOR:     "Médico",
  ADMIN:      "Administrador",
  SUPER_ADMIN: "Super Admin",
} as const;

// ─── Status labels ────────────────────────────────────────────────────────────
export const CONSULTATION_STATUS_LABELS = {
  SCHEDULED:   "Agendada",
  WAITING:     "Aguardando",
  IN_PROGRESS: "Em andamento",
  COMPLETED:   "Concluída",
  CANCELLED:   "Cancelada",
  NO_SHOW:     "Não compareceu",
} as const;

export const PAYMENT_STATUS_LABELS = {
  PENDING:   "Pendente",
  CONFIRMED: "Confirmado",
  RECEIVED:  "Pago",
  OVERDUE:   "Vencido",
  REFUNDED:  "Reembolsado",
  CANCELLED: "Cancelado",
} as const;

export const PAYMENT_METHOD_LABELS = {
  PIX:         "PIX",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO:      "Boleto bancário",
} as const;
