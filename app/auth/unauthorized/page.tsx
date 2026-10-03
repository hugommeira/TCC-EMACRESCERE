import type { Metadata } from "next";
import Link              from "next/link";
import { Logo }          from "@/components/landing/Logo";

export const metadata: Metadata = { title: "Acesso negado" };

export default function UnauthorizedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-4">
      <div aria-hidden className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-brand-200/40 blur-3xl" />

      <div className="relative w-full max-w-md animate-rise rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-900/5 ring-1 ring-slate-200">
        <div className="flex justify-center"><Logo /></div>
        <span className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-warning-50 text-warning-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">Acesso negado</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sua conta não tem permissão para abrir esta página. Se acha que é um
          engano, entre com a conta certa.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25"
          >
            Entrar com outra conta
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
