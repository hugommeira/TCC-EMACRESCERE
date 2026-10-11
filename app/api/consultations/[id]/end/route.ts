import { NextResponse }    from "next/server";
import { auth }              from "@/lib/auth";
import { endConsultation }   from "@/services/api/queue";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp } from "@/lib/security";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }
    const { id } = await Promise.resolve(ctx.params);
    const c = await endConsultation({ consultationId: id, doctorId: session.user.id });

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     AuditAction.CONSULTATION_COMPLETED,
      entity:     "Consultation",
      entityId:   c.id,
      ip:         getClientIp(req),
    });

    return NextResponse.json({ id: c.id, status: c.status });
  } catch (error) {
    return handleRouteError(error);
  }
}
