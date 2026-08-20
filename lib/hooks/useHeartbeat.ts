"use client";

import { useEffect } from "react";

/**
 * Envia heartbeat a cada `intervalMs` enquanto o componente estiver montado.
 * Usado pelo paciente para sinalizar presença na fila / consulta.
 */
export function useHeartbeat(consultationId: string | null, intervalMs = 20_000) {
  useEffect(() => {
    if (!consultationId) return;

    async function beat() {
      try {
        await fetch("/api/queue/heartbeat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ consultationId }),
          keepalive: true,
        });
      } catch {
        /* offline ou cancelado, próximo tick tenta de novo */
      }
    }

    // Primeira batida imediata
    void beat();
    const i = setInterval(beat, intervalMs);

    // Beat também quando a tab volta a ficar visível
    const onVisible = () => {
      if (document.visibilityState === "visible") void beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [consultationId, intervalMs]);
}
