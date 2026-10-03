import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { toApiError }        from "@/lib/errors";
import { checkOrigin, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { updatePatientMetrics } from "@/services/api/weight";
import { updatePatientMetricsSchema } from "@/lib/validations/weight";

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
      return NextResponse.json({ message: "Apenas pacientes" }, { status: 403 });
    }

    const rl = rateLimit({ key: `weight-metrics:${session.user.id}`, ...RL.weightUpdate });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const body   = await req.json();
    const parsed = updatePatientMetricsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const metrics = await updatePatientMetrics(session.user.id, parsed.data);
    return NextResponse.json({ data: metrics });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
