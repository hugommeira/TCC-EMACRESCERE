import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getQueuePosition } from "@/services/api/queue";
import { prisma } from "@/lib/prisma";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return apiError("PARAMETRO_INVALIDO", { message: "Informe a consulta." });
    }

    // Permite: paciente dono, médico atribuído, ou ADMIN
    const c = await prisma.consultation.findUnique({
      where: { id }, select: { patientId: true, doctorId: true },
    });
    if (!c) return apiError("CONSULTA_NAO_ENCONTRADA");

    const allowed =
      c.patientId === session.user.id ||
      c.doctorId  === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";
    if (!allowed) return apiError("CONSULTA_SEM_ACESSO");

    const pos = await getQueuePosition(id);
    return NextResponse.json(pos);
  } catch (error) {
    return handleRouteError(error);
  }
}
