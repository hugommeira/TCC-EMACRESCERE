import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { checkOrigin, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { updatePatientMetrics } from "@/services/api/weight";
import { updatePatientMetricsSchema } from "@/lib/validations/weight";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * PATCH /api/patient/metrics — altura e meta de peso do próprio paciente.
 *
 * Fica separado do perfil clínico porque é o paciente quem informa, e porque
 * a altura é o que destrava o cálculo do IMC em todo o histórico.
 */
export async function PATCH(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "PATIENT") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para pacientes." });
    }

    const rl = rateLimit({ key: `weight-metrics:${session.user.id}`, ...RL.weightUpdate });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const body   = await readJson(req);
    const parsed = updatePatientMetricsSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const metrics = await updatePatientMetrics(session.user.id, parsed.data);
    return NextResponse.json({ data: metrics });
  } catch (error) {
    return handleRouteError(error);
  }
}
