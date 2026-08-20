import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { patientHeartbeat }  from "@/services/api/queue";
import { toApiError }        from "@/lib/errors";

export const runtime = "nodejs";

const schema = z.object({ consultationId: z.string().min(1).max(40) });

/** Paciente envia heartbeat a cada ~20s pra sinalizar presença. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "consultationId obrigatório" }, { status: 422 });
    }

    const result = await patientHeartbeat({
      consultationId: parsed.data.consultationId,
      patientId:      session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
