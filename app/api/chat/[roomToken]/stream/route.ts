import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { subscribeToRoom } from "@/services/api/chat";
import { createSSEMessage } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // SSE não é compatível com Edge

export async function GET(
  req: NextRequest,
  { params }: { params: { roomToken: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verificar se o usuário pertence a esta sala
  const consultation = await prisma.consultation.findFirst({
    where: {
      roomToken: params.roomToken,
      OR: [
        { patientId: session.user.id },
        { doctorId:  session.user.id },
      ],
    },
  });

  if (!consultation) {
    return new Response("Forbidden", { status: 403 });
  }

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
        controller.close();
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
