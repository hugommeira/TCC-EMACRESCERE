import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { changePasswordSchema } from "@/lib/validations/profile";
import { changePassword }    from "@/services/api/profile";
import { AppError }          from "@/lib/errors";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";

/** POST /api/profile/password — troca a senha conferindo a atual. */
export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    // Limite apertado: senão a rota vira um jeito de adivinhar a senha atual.
    const rl = rateLimit({ key: `change-password:${session.user.id}`, ...RL.changePassword });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const parsed = changePasswordSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    try {
      await changePassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword);
    } catch (err) {
      if (err instanceof AppError && err.code === "PERFIL_SENHA_ATUAL_INCORRETA") {
        auditLog({
          actorId:  session.user.id,
          action:   AuditAction.PASSWORD_CHANGE_FAILED,
          entity:   "User",
          entityId: session.user.id,
          ip:       getClientIp(req),
        });
      }
      throw err;
    }

    auditLog({
      actorId:  session.user.id,
      action:   AuditAction.PASSWORD_CHANGED,
      entity:   "User",
      entityId: session.user.id,
      ip:       getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
