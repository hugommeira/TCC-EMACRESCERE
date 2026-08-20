import { NextResponse }                       from "next/server";
import { auth }                                from "@/lib/auth";
import { acquireSseSlot, createSseStream }     from "@/lib/realtime";
import { listQueue }                           from "@/services/api/queue";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

/** SSE para a página do médico — recebe atualizações da fila em tempo real. */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") {
    return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
  }

  const release = acquireSseSlot(session.user.id);
  if (!release) {
    return NextResponse.json({ message: "Limite de conexões atingido" }, { status: 429 });
  }

  return createSseStream(
    ["queue"],
    async () => {
      const items = await listQueue({ take: 50 });
      return [{ channel: "queue", type: "queue.snapshot", data: items }];
    },
    release,
  );
}
