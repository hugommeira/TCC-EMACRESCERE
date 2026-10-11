import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { exportOwnData }     from "@/services/api/profile";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/profile/export — baixa os dados do próprio usuário em JSON (LGPD). */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const rl = rateLimit({ key: `export:${session.user.id}`, ...RL.dataExport });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const data = await exportOwnData(session.user.id, session.user.role);

    auditLog({
      actorId: session.user.id, action: AuditAction.DATA_EXPORTED,
      entity: "User", entityId: session.user.id, ip: getClientIp(req),
    });

    const dia = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type":        "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="emacrescere-meus-dados-${dia}.json"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
