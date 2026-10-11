import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { deactivateOwnAccount, hasPassword } from "@/services/api/profile";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";

const schema = z.object({
  password: z.string().max(128).optional(),
  confirm:  z.string().max(20).optional(),
});

/**
 * POST /api/profile/deactivate — o próprio usuário desativa a conta.
 * Com senha: confirma com a senha. Conta Google: digita "DESATIVAR".
 */
export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");
    // Admin não se desativa por aqui (o painel já impede a autodesativação).
    if (session.user.role !== "PATIENT" && session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO");
    }

    const rl = rateLimit({ key: `change-password:${session.user.id}`, ...RL.changePassword });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    if (!(await hasPassword(session.user.id)) && parsed.data.confirm?.trim().toUpperCase() !== "DESATIVAR") {
      return apiError("PERFIL_CONFIRMACAO_INVALIDA", { errors: { confirm: ["Digite DESATIVAR"] } });
    }

    await deactivateOwnAccount(session.user.id, session.user.role, parsed.data.password);

    auditLog({
      actorId: session.user.id, action: AuditAction.ACCOUNT_DEACTIVATED,
      entity: "User", entityId: session.user.id, ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
