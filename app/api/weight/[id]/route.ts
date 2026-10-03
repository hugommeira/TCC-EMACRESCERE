import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { toApiError }        from "@/lib/errors";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp } from "@/lib/security";
import { deleteWeightRecord } from "@/services/api/weight";

export const runtime = "nodejs";

/** DELETE /api/weight/:id — apaga uma pesagem registrada por engano. */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { id } = await Promise.resolve(ctx.params);
    await deleteWeightRecord(id, session.user.id, session.user.role);

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     AuditAction.WEIGHT_DELETED,
      entity:     "WeightRecord",
      entityId:   id,
      ip:         getClientIp(req),
      userAgent:  req.headers.get("user-agent"),
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
