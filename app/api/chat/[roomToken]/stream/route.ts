import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { subscribeToRoom } from "@/services/api/chat";
import { createSSEMessage } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs"; // SSE não é compatível com Edge

export async function GET(
  req: NextRequest,
  { params }: { params: { roomToken: string } },
) {
  let consultation;
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    // Verificar se o usuário pertence a esta sala
    consultation = await prisma.consultation.findFirst({
      where: {
        roomToken: params.roomToken,
        OR: [
          { patientId: session.user.id },
          { doctorId:  session.user.id },
        ],
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }

  if (!consultation) return apiError("CONSULTA_SEM_ACESSO");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Envia ping inicial
      controller.enqueue(
        encoder.encode(createSSEMessage("ping", { timestamp: Date.now() })),
      );

      // Subscrever ao room
      const unsubscribe = subscribeToRoom(
        params.roomToken,
        (event, data) => {
          try {
            controller.enqueue(
              encoder.encode(createSSEMessage(event, data)),
            );
          } catch {
            // cliente desconectou
          }
        },
      );

      // Keep-alive: ping a cada 30s
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(createSSEMessage("ping", { timestamp: Date.now() })),
          );
        } catch {
          clearInterval(pingInterval);
        }
      }, 30_000);

      // Cleanup ao fechar
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try { controller.close(); } catch { /* já fechado */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // Nginx
    },
  });
}
