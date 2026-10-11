"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ERROS } from "@/lib/error-catalog";

interface ErrorStateProps {
  error?:   Error & { digest?: string };
  reset?:   () => void;
  title?:   string;
  message?: string;
  /** Para onde o botão secundário leva (ex.: início da área). */
  voltarHref?:  string;
  voltarLabel?: string;
  /** Área do médico usa o tom escuro. */
  escuro?: boolean;
}

/**
 * Tela de erro comum às error boundaries (app/**\/error.tsx).
 *
 * Em produção o Next.js não repassa a mensagem de erros do servidor ao
 * navegador (só um `digest`), então a tela é genérica; o `digest` aparece
 * como "Código de suporte" para achar o erro nos logs da Vercel.
 */
export function ErrorState({
  error, reset, title, message, voltarHref = "/", voltarLabel = "Voltar ao início", escuro = false,
}: ErrorStateProps) {
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  const texto = message ?? (offline ? ERROS.REDE_SEM_CONEXAO.mensagem : ERROS.ERRO_INTERNO.mensagem);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div
        role="alert"
        className={
          escuro
            ? "w-full max-w-md rounded-3xl bg-slate-900 p-8 text-center ring-1 ring-slate-700"
            : "w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-900/5 ring-1 ring-slate-200"
        }
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        </span>
        <h1 className={`mt-4 font-display text-2xl font-semibold ${escuro ? "text-white" : "text-slate-900"}`}>
          {title ?? "Não foi possível abrir esta página"}
        </h1>
        <p className={`mt-2 text-sm ${escuro ? "text-slate-300" : "text-slate-500"}`}>{texto}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {reset && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25"
            >
              Tentar de novo
            </button>
          )}
          <Link
            href={voltarHref as never}
            className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium ring-1 ${
              escuro ? "text-slate-200 ring-slate-600 hover:bg-slate-800" : "text-slate-700 ring-slate-300 hover:bg-slate-50"
            }`}
          >
            {voltarLabel}
          </Link>
        </div>
        {error?.digest && (
          <p className={`mt-4 text-xs ${escuro ? "text-slate-500" : "text-slate-400"}`}>
            Código de suporte: <code>{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
