"use client";

import { useState, useCallback, useEffect } from "react";
import { useSSE } from "@/hooks/useSSE";
import type { ChatMessage, SSEEventType } from "@/types";

interface UseChatOptions {
  consultationId: string;
  roomToken:      string;
  currentUserId:  string;
}

interface UseChatReturn {
  messages:     ChatMessage[];
  isConnected:  boolean;
  isSending:    boolean;
  error:        string | null;
  sendMessage:  (content: string) => Promise<void>;
  loadHistory:  () => Promise<void>;
}

export function useChat({
  // consultationId fica na interface por compatibilidade; as rotas usam o roomToken.
  roomToken,
  currentUserId,
}: UseChatOptions): UseChatReturn {
  const [messages,    setMessages]   = useState<ChatMessage[]>([]);
  const [isSending,   setIsSending]  = useState(false);
  const [isConnected, setConnected]  = useState(false);
  const [error,       setError]      = useState<string | null>(null);

  // As rotas /api/chat/[roomToken]/* são indexadas pelo roomToken da sala. Antes
  // este hook mandava o id da consulta: toda chamada dava 404 e a tela quebrava
  // ao ler `json.data.length` (undefined).
  const loadHistory = useCallback(async () => {
    if (!roomToken) return;
    try {
      const res  = await fetch(`/api/chat/${roomToken}/messages`, { cache: "no-store" });
      const json = await res.json() as { data?: ChatMessage[]; message?: string };
      if (!res.ok) { setError(json.message ?? "Falha ao carregar histórico"); return; }
      setMessages(json.data ?? []);
    } catch {
      setError("Falha ao carregar histórico");
    }
  }, [roomToken]);

  // O SSE via pg LISTEN/NOTIFY não entrega de forma confiável em produção
  // (Neon serverless + Vercel) — a sala da consulta já usa polling pelo mesmo
  // motivo. Aqui também: recarrega o histórico a cada 5s.
  useEffect(() => {
    if (!roomToken) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void loadHistory();
    }, 5000);
    return () => clearInterval(t);
  }, [roomToken, loadHistory]);

  const handleSSEMessage = useCallback(
    (event: SSEEventType, data: unknown) => {
      if (event === "message") {
        const msg = data as ChatMessage;
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          return exists ? prev : [...prev, msg];
        });
      }

      if (event === "ping") {
        setConnected(true);
      }
    },
    [],
  );

  const { connected } = useSSE({
    url:       `/api/chat/${roomToken}/stream`,
    enabled:   Boolean(roomToken),
    onMessage: handleSSEMessage,
    onOpen:    () => setConnected(true),
    onError:   () => setConnected(false),
  });

  useEffect(() => {
    setConnected(connected);
  }, [connected]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      setIsSending(true);
      setError(null);

      try {
        const res = await fetch(`/api/chat/${roomToken}/messages`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ content }),
        });

        if (!res.ok) {
          const err = await res.json() as { message: string };
          throw new Error(err.message);
        }
        // Sem depender do SSE pra mensagem aparecer pra quem enviou.
        await loadHistory();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao enviar mensagem");
      } finally {
        setIsSending(false);
      }
    },
    [roomToken, isSending, loadHistory],
  );

  // Marcar como lido ao receber novas mensagens
  useEffect(() => {
    if (messages.length === 0) return;

    const unread = messages.filter(
      (m) => m.sender.id !== currentUserId && !m.readAt,
    );

    if (unread.length > 0) {
      void fetch(`/api/chat/${roomToken}/read`, { method: "POST" });
    }
  }, [messages, roomToken, currentUserId]);

  return {
    messages,
    isConnected,
    isSending,
    error,
    sendMessage,
    loadHistory,
  };
}
