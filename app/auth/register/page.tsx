import type { Metadata }    from "next";
import Image                from "next/image";
import Link                 from "next/link";
import { RegisterForm }     from "@/components/auth/RegisterForm";
import { Logo }             from "@/components/landing/Logo";

export const metadata: Metadata = { title: "Criar conta de paciente" };

const PERKS = [
  "Consulta com endocrinologista certificado",
  "Receita digital válida em todo o Brasil",
  "Caneta entregue em casa em até 48h",
  "Acompanhamento médico pelo app, 24h",
];

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80"
          alt=""
          fill
          priority
          className="object-cover opacity-50"
          sizes="50vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-ink-950/85 via-brand-900/70 to-emerald-700/50"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-teal-400/30 blur-3xl"
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo variant="light" />

          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Cadastro rápido em 2 minutos
            </span>

            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight">
              Comece sua jornada de emagrecimento com saúde.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              Sem mensalidade. Você só paga quando agendar sua primeira consulta.
            </p>

            <ul className="mt-10 space-y-3">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">
            Médicos e farmácias parceiros são cadastrados pela equipe Emaerescere.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-6 sm:px-10 lg:hidden">
          <Logo />
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Início
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
          <div className="w-full max-w-md">
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

            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Conta de paciente
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
              Crie sua conta grátis
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              É rápido e seguro. Seus dados ficam protegidos pela LGPD.
            </p>

            <div className="mt-8">
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
