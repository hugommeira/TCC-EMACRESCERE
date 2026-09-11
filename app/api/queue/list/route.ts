import { NextResponse } from "next/server";
import { auth }          from "@/lib/auth";
import { listQueue }     from "@/services/api/queue";
import { assertDoctorApproved } from "@/services/api/user";
import { toApiError }    from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }
    // Médico com credenciamento pendente/reprovado não vê a fila.
    await assertDoctorApproved(session.user.id);

    const items = await listQueue({ take: 50 });
    return NextResponse.json({ items });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
