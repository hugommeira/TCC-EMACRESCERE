import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { validatePrescription } from "@/services/api/prescription";
import { toApiError }      from "@/lib/errors";

// Rota pública: farmácias/terceiros validam prescrições pelo hash
export async function GET(req: NextRequest) {
  try {
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
