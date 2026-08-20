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
  consultationId,
  roomToken,
  currentUserId,
}: UseChatOptions): UseChatReturn {
  const [messages,    setMessages]   = useState<ChatMessage[]>([]);
  const [isSending,   setIsSending]  = useState(false);
  const [isConnected, setConnected]  = useState(false);
  const [error,       setError]      = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res  = await fetch(`/api/chat/${consultationId}/messages`);
      const json = await res.json() as { data: ChatMessage[] };
      setMessages(json.data);
    } catch {
      setError("Falha ao carregar histórico");
    }
  }, [consultationId]);

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
        const res = await fetch(`/api/chat/${consultationId}/messages`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ content }),
        });

        if (!res.ok) {
          const err = await res.json() as { message: string };
          throw new Error(err.message);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao enviar mensagem");
      } finally {
        setIsSending(false);
      }
    },
    [consultationId, isSending],
  );

  // Marcar como lido ao receber novas mensagens
  useEffect(() => {
    if (messages.length === 0) return;

    const unread = messages.filter(
      (m) => m.sender.id !== currentUserId && !m.readAt,
    );

    if (unread.length > 0) {
      void fetch(`/api/chat/${consultationId}/read`, { method: "POST" });
    }
  }, [messages, consultationId, currentUserId]);

  return {
    messages,
    isConnected,
    isSending,
    error,
    sendMessage,
    loadHistory,
  };
}
