import { auth }                                from "@/lib/auth";
import { prisma }                              from "@/lib/prisma";
import { acquireSseSlot, createSseStream }     from "@/lib/realtime";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SSE da sala da consulta: chat, status, anexos, prontuário. */
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
      where: { id }, select: { patientId: true, doctorId: true },
    });
    if (!c) return apiError("CONSULTA_NAO_ENCONTRADA");
    const allowed =
      c.patientId === session.user.id ||
      c.doctorId  === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";
    if (!allowed) return apiError("CONSULTA_SEM_ACESSO");

    const release = acquireSseSlot(session.user.id);
    if (!release) {
      return apiError("LIMITE_REQUISICOES", { message: "Muitas abas abertas nesta conta. Feche algumas e recarregue a página." });
    }

    return createSseStream([`consultation:${id}`], undefined, release);
  } catch (error) {
    return handleRouteError(error);
  }
}
