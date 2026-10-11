import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/errors";

interface AuditOptions {
  actorId?:    string | null;
  actorEmail?: string | null;
  action:      string;
  entity:      string;
  entityId?:   string | null;
  before?:     unknown;
  after?:      unknown;
  ip?:         string | null;
  userAgent?:  string | null;
}

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/**
 * Registra uma entrada no audit log (fire-and-forget).
 * Erros silenciados pra não interromper o fluxo principal.
 */
export function auditLog(opts: AuditOptions): void {
  const data = clean({
    actorId:    opts.actorId    ?? undefined,
    actorEmail: opts.actorEmail ?? undefined,
    action:     opts.action,
    entity:     opts.entity,
    entityId:   opts.entityId   ?? undefined,
    before:     opts.before ? (opts.before as object) : undefined,
    after:      opts.after  ? (opts.after  as object) : undefined,
    ip:         opts.ip        ?? undefined,
    userAgent:  opts.userAgent ?? undefined,
  });

  // Nem erro assíncrono (banco) nem síncrono (cliente indisponível) pode
  // interromper a ação que está sendo auditada: INFRA_AUDITORIA_FALHOU só no log.
  try {
    void prisma.auditLog
      .create({ data: data as Parameters<typeof prisma.auditLog.create>[0]["data"] })
      .catch((err: unknown) => logError("INFRA_AUDITORIA_FALHOU", err, { acao: opts.action }));
  } catch (err) {
    logError("INFRA_AUDITORIA_FALHOU", err, { acao: opts.action });
  }
}

// ─── Ações comuns ─────────────────────────────────────────────────────────────

export const AuditAction = {
  USER_REGISTER:           "user.register",
  USER_LOGIN:              "user.login",
  USER_LOGIN_FAILED:       "user.login_failed",
  USER_LOGOUT:             "user.logout",
  DOCTOR_APPROVED:         "doctor.approved",
  DOCTOR_REJECTED:         "doctor.rejected",
  PASSWORD_RESET_REQUESTED: "user.password_reset_requested",
  PASSWORD_RESET_COMPLETED: "user.password_reset_completed",
  OAUTH_ACCOUNT_LINKED:    "user.oauth_account_linked",
  PROFILE_UPDATED:         "user.profile_updated",
  AVATAR_UPDATED:          "user.avatar_updated",
  PASSWORD_CHANGED:        "user.password_changed",
  PASSWORD_CHANGE_FAILED:  "user.password_change_failed",
  ACCOUNT_DEACTIVATED:     "user.account_deactivated",
  DATA_EXPORTED:           "user.data_exported",
  CONSULTATION_CREATED:    "consultation.created",
  CONSULTATION_QUEUED:     "consultation.queued",
  CONSULTATION_CLAIMED:    "consultation.claimed",
  CONSULTATION_CANCELLED:  "consultation.cancelled",
  CONSULTATION_STARTED:    "consultation.started",
  CONSULTATION_COMPLETED:  "consultation.completed",
  PAYMENT_CREATED:         "payment.created",
  PAYMENT_CONFIRMED:       "payment.confirmed",
  PAYMENT_REFUNDED:        "payment.refunded",
  PRESCRIPTION_CREATED:    "prescription.created",
  PRESCRIPTION_ISSUED:     "prescription.issued",
  FOLLOW_UP_CREATED:       "followup.created",
  FOLLOW_UP_RESPONDED:     "followup.responded",
  ATTACHMENT_UPLOADED:     "attachment.uploaded",
  WEIGHT_RECORDED:         "weight.recorded",
  WEIGHT_DELETED:          "weight.deleted",
  RATE_LIMIT_HIT:          "security.rate_limit",
  WEBHOOK_AUTH_FAILED:     "security.webhook_auth_failed",
} as const;
