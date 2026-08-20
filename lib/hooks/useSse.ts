"use client";

import { useEffect, useRef } from "react";

type Handler = (data: unknown) => void;

// ─── Conexões compartilhadas (1 EventSource por URL) ──────────────────────────
//
// useSse pode ser chamado em vários componentes pra mesma URL. Cada chamada NÃO
// abre uma nova conexão — em vez disso, todas compartilham uma única EventSource
// e disparam handlers locais. Isso evita estourar o limite de SSE/usuário.

interface SharedConn {
  url:       string;
  source:    EventSource;
  listeners: Map<string, Set<Handler>>;
  refCount:  number;
}

const conns = new Map<string, SharedConn>();

function getOrCreate(url: string): SharedConn {
  const existing = conns.get(url);
  if (existing) {
    existing.refCount += 1;
    return existing;
  }
  const source = new EventSource(url, { withCredentials: true });
  const conn: SharedConn = {
    url,
    source,
    listeners: new Map(),
    refCount: 1,
  };
  conns.set(url, conn);

  // EventSource dispatcha por type — registramos um meta-listener no `message`
  // genérico? Não — o source.addEventListener("type") é específico. Por isso,
  // vamos delegar registro por tipo (cada handler adiciona seu próprio).
  // Aqui só registramos onerror/onopen pro pool.
  source.onerror = () => {
    // Browser EventSource reconecta sozinho; só fechamos manualmente em release().
  };
  return conn;
}

function release(url: string) {
  const c = conns.get(url);
  if (!c) return;
  c.refCount -= 1;
  if (c.refCount <= 0) {
    c.source.close();
    conns.delete(url);
  }
}

/**
 * Hook que reaproveita 1 EventSource por URL e dispatcha por type.
 */
export function useSse(
  url:      string | null,
  handlers: Record<string, Handler>,
  enabled = true,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || !url) return;

    const conn = getOrCreate(url);
    const localUnsubs: Array<() => void> = [];

    for (const type of Object.keys(handlersRef.current)) {
      const dispatcher = (ev: Event) => {
        try {
          const payload = JSON.parse((ev as MessageEvent).data);
          handlersRef.current[type]?.(payload?.data ?? payload);
        } catch {
          handlersRef.current[type]?.((ev as MessageEvent).data);
        }
      };
      conn.source.addEventListener(type, dispatcher);
      localUnsubs.push(() => conn.source.removeEventListener(type, dispatcher));
    }

    return () => {
      for (const u of localUnsubs) u();
      release(url);
    };
  }, [url, enabled]);
}
