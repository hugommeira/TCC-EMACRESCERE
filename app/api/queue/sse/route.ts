import { auth }                                from "@/lib/auth";
import { acquireSseSlot, createSseStream }     from "@/lib/realtime";
import { listQueue }                           from "@/services/api/queue";
import { assertDoctorApproved }                from "@/services/api/user";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

/** SSE para a página do médico — recebe atualizações da fila em tempo real. */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }
    // Mesma regra de /api/queue/list e /claim: médico com credenciamento
    // pendente ou reprovado não vê a fila. Sem isso, qualquer um que se
    // cadastrasse como médico lia nome, alergias e queixa dos pacientes.
    await assertDoctorApproved(session.user.id);

    const release = acquireSseSlot(session.user.id);
    if (!release) {
      return apiError("LIMITE_REQUISICOES", { message: "Muitas abas abertas nesta conta. Feche algumas e recarregue a página." });
    }

    return createSseStream(
      ["queue"],
      async () => {
        const items = await listQueue({ take: 50 });
        return [{ channel: "queue", type: "queue.snapshot", data: items }];
      },
      release,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
