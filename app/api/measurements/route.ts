import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { createMeasureSchema, listMeasuresQuerySchema } from "@/lib/validations/measures";
import { createMeasure, getMeasures } from "@/services/api/measures";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/measurements?patientId= — medidas do corpo (cintura, quadril,
 * gordura, massa magra) e as relações calculadas (RCEst, RCQ). Sem
 * patientId, as do usuário logado. Acesso como no peso (services/api/weight.ts).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const parsed = listMeasuresQuerySchema.safeParse({
      patientId: req.nextUrl.searchParams.get("patientId") ?? undefined,
    });
    if (!parsed.success) return validationError(parsed.error, "Parâmetros inválidos");

    const data = await getMeasures(parsed.data.patientId ?? session.user.id, session.user.id, session.user.role);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/measurements — paciente registra a própria medida; médico, a do paciente. */
export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const rl = rateLimit({ key: `measure:${session.user.id}`, ...RL.weight });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const parsed = createMeasureSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const patientId = parsed.data.patientId ?? session.user.id;
    const medida = await createMeasure({
      patientId,
      requesterId:    session.user.id,
      requesterRole:  session.user.role,
      type:           parsed.data.type,
      value:          parsed.data.value,
      measuredAt:     parsed.data.measuredAt,
      note:           parsed.data.note,
      consultationId: parsed.data.consultationId,
    });

    auditLog({
      actorId:   session.user.id,
      action:    AuditAction.MEASUREMENT_RECORDED,
      entity:    "BodyMeasurement",
      entityId:  medida.id,
      after:     { patientId, type: medida.type, source: medida.source },
      ip:        getClientIp(req),
    });

    return NextResponse.json({ data: { ...medida, value: Number(medida.value.toString()) } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
