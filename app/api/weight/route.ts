import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, RL, rateLimit, tooManyRequests, getClientIp } from "@/lib/security";
import { getWeightHistory, createWeightRecord } from "@/services/api/weight";
import { createWeightRecordSchema, listWeightQuerySchema } from "@/lib/validations/weight";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/weight?patientId=&range=30d|90d|180d|365d|all
 *
 * Sem patientId, devolve o histórico de quem está logado (o caso do
 * paciente). Com patientId, o médico vê o do paciente dele — a checagem de
 * vínculo está em services/api/weight.ts.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const parsed = listWeightQuerySchema.safeParse({
      patientId: req.nextUrl.searchParams.get("patientId") ?? undefined,
      range:     req.nextUrl.searchParams.get("range")     ?? undefined,
    });
    if (!parsed.success) {
      return validationError(parsed.error, "Parâmetros inválidos");
    }

    const patientId = parsed.data.patientId ?? session.user.id;
    const history   = await getWeightHistory(
      patientId, session.user.id, session.user.role, parsed.data.range,
    );

    return NextResponse.json({ data: history });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/weight — paciente registra o próprio peso; médico, o do paciente. */
export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const rl = rateLimit({ key: `weight:${session.user.id}`, ...RL.weight });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const body   = await readJson(req);
    const parsed = createWeightRecordSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const patientId = parsed.data.patientId ?? session.user.id;

    const ponto = await createWeightRecord({
      patientId,
      requesterId:   session.user.id,
      requesterRole: session.user.role,
      weightKg:      parsed.data.weightKg,
      ...(parsed.data.measuredAt     ? { measuredAt: parsed.data.measuredAt } : {}),
      ...(parsed.data.note           ? { note: parsed.data.note } : {}),
      ...(parsed.data.consultationId ? { consultationId: parsed.data.consultationId } : {}),
    });

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     AuditAction.WEIGHT_RECORDED,
      entity:     "WeightRecord",
      entityId:   ponto.id,
      after:      { patientId, weightKg: ponto.weightKg, source: ponto.source },
      ip:         getClientIp(req),
      userAgent:  req.headers.get("user-agent"),
    });

    return NextResponse.json({ data: ponto }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
