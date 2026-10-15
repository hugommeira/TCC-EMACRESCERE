import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp } from "@/lib/security";
import { deleteMeasure }     from "@/services/api/measures";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";

/** DELETE /api/measurements/:id — apaga uma medida registrada por engano. */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const { id } = await Promise.resolve(ctx.params);
    await deleteMeasure(id, session.user.id, session.user.role);

    auditLog({
      actorId:  session.user.id,
      action:   AuditAction.MEASUREMENT_DELETED,
      entity:   "BodyMeasurement",
      entityId: id,
      ip:       getClientIp(req),
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return handleRouteError(error);
  }
}
