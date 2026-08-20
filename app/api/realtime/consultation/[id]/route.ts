import { NextResponse }                       from "next/server";
import { auth }                                from "@/lib/auth";
import { prisma }                              from "@/lib/prisma";
import { acquireSseSlot, createSseStream }     from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SSE da sala da consulta: chat, status, anexos, prontuário. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  const { id } = await Promise.resolve(ctx.params);

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

  const release = acquireSseSlot(session.user.id);
  if (!release) {
    return NextResponse.json({ message: "Limite de conexões atingido" }, { status: 429 });
  }

  return createSseStream([`consultation:${id}`], undefined, release);
}
