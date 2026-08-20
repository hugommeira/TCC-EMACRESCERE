import { prisma } from "@/lib/prisma";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import type { ChatMessage } from "@/types";
import type { MessageType } from "@prisma/client";

// ─── In-memory SSE subscriber store ──────────────────────────────────────────
// Para produção escalável: substituir por Redis Pub/Sub

type Subscriber = (event: string, data: unknown) => void;

const subscribers = new Map<string, Set<Subscriber>>();

export function subscribeToRoom(roomToken: string, fn: Subscriber): () => void {
  if (!subscribers.has(roomToken)) {
    subscribers.set(roomToken, new Set());
  }
  subscribers.get(roomToken)!.add(fn);

  // Retorna função de cleanup
  return () => {
    subscribers.get(roomToken)?.delete(fn);
    if (subscribers.get(roomToken)?.size === 0) {
      subscribers.delete(roomToken);
    }
  };
}

export function broadcastToRoom(
  roomToken: string,
  event: string,
  data: unknown,
): void {
  subscribers.get(roomToken)?.forEach((fn) => fn(event, data));
}

// ─── Save and broadcast message ───────────────────────────────────────────────

export async function sendMessage(
  consultationId: string,
  senderId: string,
  content: string,
  type: MessageType = "TEXT",
  fileUrl?: string,
): Promise<ChatMessage> {
  // Verificar participação
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!consultation) throw new NotFoundError("Consulta");
  if (
    consultation.patientId !== senderId &&
    consultation.doctorId  !== senderId
  ) {
    throw new ForbiddenError();
  }

  if (consultation.status !== "IN_PROGRESS" && consultation.status !== "WAITING") {
    throw new ForbiddenError("Chat disponível apenas durante consultas ativas");
  }

  const message = await prisma.message.create({
    data: {
      consultationId,
      senderId,
      content,
      type,
      fileUrl,
    },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
    },
  });

  const chatMessage: ChatMessage = {
    id:        message.id,
    content:   message.content,
    type:      message.type,
    sender:    message.sender,
    createdAt: message.createdAt,
    readAt:    message.readAt,
  };

  // Broadcast via SSE
  if (consultation.roomToken) {
    broadcastToRoom(consultation.roomToken, "message", chatMessage);
  }

  return chatMessage;
}

// ─── Load message history ─────────────────────────────────────────────────────

export async function getMessageHistory(
  consultationId: string,
  requesterId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!consultation) throw new NotFoundError("Consulta");
  if (
    consultation.patientId !== requesterId &&
    consultation.doctorId  !== requesterId
  ) {
    throw new ForbiddenError();
  }

  const messages = await prisma.message.findMany({
    where:   { consultationId },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });

  return messages.reverse().map((m) => ({
    id:        m.id,
    content:   m.content,
    type:      m.type,
    sender:    m.sender,
    createdAt: m.createdAt,
    readAt:    m.readAt,
  }));
}

// ─── Mark messages as read ────────────────────────────────────────────────────

export async function markMessagesAsRead(
  consultationId: string,
  readerId: string,
): Promise<void> {
  await prisma.message.updateMany({
    where: {
      consultationId,
      senderId: { not: readerId },
      readAt:   null,
    },
    data: { readAt: new Date() },
  });
}
