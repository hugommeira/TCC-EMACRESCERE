import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { claimFromQueue } from "@/services/api/queue";
import { assertDoctorApproved } from "@/services/api/user";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { apiError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";

const schema = z.object({ consultationId: z.string().min(1).max(40) });

export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }
    // Só médico credenciado pega paciente da fila.
    await assertDoctorApproved(session.user.id);

    const ip = getClientIp(req);
    const rl = rateLimit({ key: `queue.claim:${session.user.id}`, ...RL.queueClaim });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const body   = await readJson(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("PARAMETRO_INVALIDO", { message: "Informe a consulta." });
    }

    const consultation = await claimFromQueue({
      consultationId: parsed.data.consultationId,
      doctorId:       session.user.id,
    });

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     AuditAction.CONSULTATION_CLAIMED,
      entity:     "Consultation",
      entityId:   consultation.id,
      ip,
    });

    return NextResponse.json({
      id:          consultation.id,
      livekitRoom: consultation.livekitRoom,
      status:      consultation.status,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
