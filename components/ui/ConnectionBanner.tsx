"use client";

import { useEffect, useState } from "react";
import { observarConexao } from "@/lib/api-client";
import { ERROS } from "@/lib/error-catalog";

/** Falhas seguidas de rede antes de avisar (polling de 5 s → ~15 s sem resposta). */
const LIMIAR_INSTAVEL = 3;

/**
 * Aviso fixo no topo quando o aparelho fica offline (REDE_SEM_CONEXAO) ou
 * quando as chamadas à API falham seguidas vezes (CONEXAO_INSTAVEL). Some
 * sozinho quando a conexão volta. Montado uma vez em app/layout.tsx.
 */
export function ConnectionBanner() {
  const [offline, setOffline] = useState(false);
  const [falhas, setFalhas]   = useState(0);

  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    const parar = observarConexao(setFalhas);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
      parar();
    };
  }, []);

  const texto = offline
    ? ERROS.REDE_SEM_CONEXAO.mensagem
    : falhas >= LIMIAR_INSTAVEL ? ERROS.CONEXAO_INSTAVEL.mensagem : null;

  if (!texto) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-2"
    >
      <p className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-1.5 text-sm font-medium text-white shadow-lg">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />
        {texto}
      </p>
    </div>
  );
}
