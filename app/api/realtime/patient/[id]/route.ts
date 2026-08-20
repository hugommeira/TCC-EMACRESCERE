import { NextResponse }                       from "next/server";
import { auth }                                from "@/lib/auth";
import { prisma }                              from "@/lib/prisma";
import { acquireSseSlot, createSseStream }     from "@/lib/realtime";
import { getQueuePosition }                    from "@/services/api/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SSE pessoal do paciente: posição na fila + claim do médico. */
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
    where: { id }, select: { patientId: true },
  });
  if (!c)                              return NextResponse.json({ message: "Consulta não encontrada" }, { status: 404 });
  if (c.patientId !== session.user.id) return NextResponse.json({ message: "Sem permissão" }, { status: 403 });

  const release = acquireSseSlot(session.user.id);
  if (!release) {
    return NextResponse.json({ message: "Limite de conexões atingido" }, { status: 429 });
  }

  return createSseStream(
    [`patient:${session.user.id}`, `consultation:${id}`],
    async () => {
      const pos = await getQueuePosition(id);
      return [{ channel: `patient:${session.user.id}`, type: "patient.snapshot", data: pos }];
    },
    release,
  );
}
