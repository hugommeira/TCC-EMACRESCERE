import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { patientHeartbeat }  from "@/services/api/queue";
import { apiError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";

const schema = z.object({ consultationId: z.string().min(1).max(40) });

/** Paciente envia heartbeat a cada ~20s pra sinalizar presença. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const body   = await readJson(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("PARAMETRO_INVALIDO", { message: "Informe a consulta." });
    }

    const result = await patientHeartbeat({
      consultationId: parsed.data.consultationId,
      patientId:      session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
