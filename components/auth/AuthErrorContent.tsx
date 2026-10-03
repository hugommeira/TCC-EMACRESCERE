"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "Este e-mail já está cadastrado com outro método de login. Entre com e-mail e senha, ou use \"Esqueci minha senha\" para defini-la.",
  AccessDenied: "Login cancelado.",
  Configuration: "Login social não está configurado no momento. Tente entrar com e-mail e senha.",
  CredentialsSignin: "E-mail ou senha incorretos.",
};

export function AuthErrorContent() {
  const error   = useSearchParams().get("error");
  const message = (error && ERROR_MESSAGES[error]) ??
    "Não foi possível completar o login. Verifique suas credenciais e tente novamente.";

  return (
    <div className="relative w-full max-w-md animate-rise rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-900/5 ring-1 ring-slate-200">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">Não foi possível entrar</h1>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      <Link
        href="/auth/login"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25"
      >
        Tentar novamente
      </Link>
    </div>
  );
}
