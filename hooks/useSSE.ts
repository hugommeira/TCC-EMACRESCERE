"use client";

import { useEffect, useRef, useCallback } from "react";
import type { SSEEventType } from "@/types";

interface UseSSEOptions {
  url:       string;
  enabled?:  boolean;
  onMessage: (event: SSEEventType, data: unknown) => void;
  onError?:  (error: Event) => void;
  onOpen?:   () => void;
}

export function useSSE({
  url,
  enabled = true,
  onMessage,
  onError,
  onOpen,
}: UseSSEOptions): { connected: boolean } {
  const esRef        = useRef<EventSource | null>(null);
  const connectedRef = useRef(false);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      connectedRef.current = true;
      onOpen?.();
    };

    es.onerror = (e) => {
      connectedRef.current = false;
      onError?.(e);
      // Reconexão automática após 3s em caso de erro
      setTimeout(() => {
        if (enabled) connect();
      }, 3000);
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as { type: SSEEventType; data: unknown };
        onMessage(data.type, data.data);
      } catch {
        // ignorar mensagens malformadas
      }
    };

    // Registrar listeners por tipo de evento
    const events: SSEEventType[] = [
      "message",
      "consultation:status",
      "consultation:started",
      "consultation:ended",
      "user:joined",
      "user:left",
      "ping",
    ];

    events.forEach((eventType) => {
      es.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data as string) as unknown;
          onMessage(eventType, data);
        } catch {
          // ignorar
        }
      });
    });
  }, [url, enabled, onMessage, onError, onOpen]);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [enabled, connect]);

  return { connected: connectedRef.current };
}
