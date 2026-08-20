import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getQueuePosition } from "@/services/api/queue";
import { prisma } from "@/lib/prisma";
import { toApiError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "id obrigatório" }, { status: 422 });
    }

    // Permite: paciente dono, médico atribuído, ou ADMIN
    const c = await prisma.consultation.findUnique({
      where: { id }, select: { patientId: true, doctorId: true },
    });
    if (!c) return NextResponse.json({ message: "Consulta não encontrada" }, { status: 404 });

    const allowed =
      c.patientId === session.user.id ||
      c.doctorId  === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";
    if (!allowed) return NextResponse.json({ message: "Sem permissão" }, { status: 403 });

    const pos = await getQueuePosition(id);
    return NextResponse.json(pos);
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
