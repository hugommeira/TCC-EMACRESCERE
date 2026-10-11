import { auth }                                from "@/lib/auth";
import { prisma }                              from "@/lib/prisma";
import { acquireSseSlot, createSseStream }     from "@/lib/realtime";
import { getQueuePosition }                    from "@/services/api/queue";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SSE pessoal do paciente: posição na fila + claim do médico. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const { id } = await Promise.resolve(ctx.params);

    const c = await prisma.consultation.findUnique({
      where: { id }, select: { patientId: true },
    });
    if (!c)                              return apiError("CONSULTA_NAO_ENCONTRADA");
    if (c.patientId !== session.user.id) return apiError("CONSULTA_SEM_ACESSO");

    const release = acquireSseSlot(session.user.id);
    if (!release) {
      return apiError("LIMITE_REQUISICOES", { message: "Muitas abas abertas nesta conta. Feche algumas e recarregue a página." });
    }

    return createSseStream(
      [`patient:${session.user.id}`, `consultation:${id}`],
      async () => {
        const pos = await getQueuePosition(id);
        return [{ channel: `patient:${session.user.id}`, type: "patient.snapshot", data: pos }];
      },
      release,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
