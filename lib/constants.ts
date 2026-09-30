// ─── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Emacrescere";
export const APP_URL  = process.env.NEXT_PUBLIC_APP_URL  ?? "http://localhost:3000";

// ─── Escopo: fila on-demand ───────────────────────────────────────────────────
// Nesta entrega o atendimento é só por agendamento. A fila on-demand virou
// trabalho futuro (TCC, seção 5.5.1), mas NADA dela foi apagado: rotas
// app/api/queue/*, services/api/queue.ts, componentes, telas e os campos do
// schema continuam no repositório. Esta chave só esconde os pontos de entrada
// da interface — pra reativar a fila, basta trocar para true.
//
// Anotado como boolean (e não como o literal false) pra o TypeScript não
// tratar o código atrás da chave como inalcançável.
export const QUEUE_ENABLED: boolean = false;

// Pra onde apontam os botões de "nova consulta" (paciente) e a tela de
// trabalho do médico, conforme a fila esteja ligada ou não.
export const PATIENT_NEW_CONSULTATION_HREF = QUEUE_ENABLED
  ? "/dashboard/patient/queue"
  : "/dashboard/patient/schedule";
export const DOCTOR_WORK_HREF = QUEUE_ENABLED
  ? "/dashboard/doctor/queue"
  : "/dashboard/doctor/consultations";

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
