import { NextResponse } from "next/server";
import { auth }          from "@/lib/auth";
import { listQueue }     from "@/services/api/queue";
import { assertDoctorApproved } from "@/services/api/user";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }
    // Médico com credenciamento pendente/reprovado não vê a fila.
    await assertDoctorApproved(session.user.id);

    const items = await listQueue({ take: 50 });
    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
