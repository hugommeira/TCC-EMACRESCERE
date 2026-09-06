import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { validatePrescription } from "@/services/api/prescription";
import { toApiError }      from "@/lib/errors";
import { RL, rateLimit, tooManyRequests, getClientIp } from "@/lib/security";

// Rota pública: farmácias/terceiros validam prescrições pelo hash
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit({ key: `prescription-validate:${ip}`, ...RL.prescriptionValidate });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const { searchParams } = req.nextUrl;
    const id   = searchParams.get("id");
    const hash = searchParams.get("hash");

    if (!id || !hash) {
      return NextResponse.json(
        { message: "Parâmetros id e hash são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await validatePrescription(id, hash);
    return NextResponse.json({ data: result });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
