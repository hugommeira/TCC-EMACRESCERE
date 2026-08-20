import type { Metadata } from "next";
import Image             from "next/image";
import Link              from "next/link";
import { Suspense }      from "react";
import { LoginForm }     from "@/components/auth/LoginForm";
import { Logo }          from "@/components/landing/Logo";

export const metadata: Metadata = { title: "Entrar" };

const HIGHLIGHTS = [
  {
    title: "Acompanhamento contínuo",
    desc:  "Seu médico acompanha seu progresso pelo app, sempre que precisar.",
  },
  {
    title: "Receita digital válida",
    desc:  "Prescrições com assinatura certificada conforme CFM 2.314/2022.",
  },
  {
    title: "Entrega segura em 48h",
    desc:  "Caneta de emagrecimento entregue em casa, com rastreamento.",
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80"
          alt=""
          fill
          priority
          className="object-cover opacity-50"
          sizes="50vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-ink-950/85 via-brand-900/70 to-teal-700/60"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl"
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo variant="light" />

          <div className="max-w-md">
            <h1 className="font-display text-4xl font-semibold leading-tight">
              Sua jornada de emagrecimento começa aqui.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              Plataforma médica para tratamento seguro com a caneta de emagrecimento.
            </p>

            <ul className="mt-10 space-y-4">
              {HIGHLIGHTS.map((h) => (
                <li key={h.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 backdrop-blur">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{h.title}</p>
                    <p className="text-xs leading-relaxed text-white/70">{h.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Emaerescere · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-6 sm:px-10 lg:hidden">
          <Logo />
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Início
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="hidden lg:mb-8 lg:block">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Voltar para o início
              </Link>
            </div>

            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Entre na sua conta para continuar seu tratamento.
            </p>

            <div className="mt-8">
              <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
