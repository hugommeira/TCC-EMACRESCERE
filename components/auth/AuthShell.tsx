import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Logo } from "@/components/landing/Logo";
import { Photo } from "@/components/landing/Photo";
import { Scene3D } from "@/components/three/Scene3D";
import { Cormorant_Garamond } from "next/font/google";

// Letra do nome no painel de login (só nas telas de autenticação).
const signature = Cormorant_Garamond({
  subsets: ["latin"],
  weight:  "600",
  style:   "italic",
  display: "swap",
});

// Layout único das telas de autenticação: painel de marca à esquerda (só no
// desktop) e formulário à direita. Antes cada página repetia o painel inteiro.
// "doctor" usa o tom escuro da área profissional, para o médico perceber logo
// que está numa jornada diferente da do paciente.

type Variant = "patient" | "doctor";

export interface AuthShellProps {
  variant?: Variant;
  photo: string;
  /** Painel lateral */
  badge?: string;
  headline: string;
  lead: string;
  points?: ReadonlyArray<string | { title: string; desc: string }>;
  footnote?: ReactNode;
  /** Coluna do formulário */
  eyebrow?: string;
  title: string;
  subtitle: ReactNode;
  /** Largura do formulário (o cadastro tem mais campos) */
  wide?: boolean;
  /** Link secundário no topo do celular (padrão: voltar ao início) */
  mobileLink?: { href: Route; label: string };
  children: ReactNode;
  after?: ReactNode;
}

const d = (ms: number) => ({ animationDelay: `${ms}ms` });

const TONE: Record<Variant, { overlay: string; glow: string; check: string; eyebrow: string }> = {
  patient: {
    overlay: "from-ink-950/85 via-brand-900/70 to-teal-700/55",
    glow:    "bg-brand-500/30",
    check:   "bg-emerald-400/20 text-emerald-200 ring-emerald-300/30",
    eyebrow: "border-brand-200 bg-brand-50 text-brand-700",
  },
  doctor: {
    overlay: "from-ink-950/95 via-ink-950/80 to-brand-900/60",
    glow:    "bg-teal-500/25",
    check:   "bg-teal-400/15 text-teal-200 ring-teal-300/30",
    eyebrow: "border-ink-200 bg-ink-50 text-ink-800",
  },
};

export function AuthShell({
  variant = "patient",
  photo,
  badge,
  headline,
  lead,
  points = [],
  footnote,
  eyebrow,
  title,
  subtitle,
  wide = false,
  mobileLink = { href: "/", label: "← Início" },
  children,
  after,
}: AuthShellProps) {
  const tone = TONE[variant];

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Painel de marca */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:sticky lg:top-0 lg:block lg:h-screen">
        <Photo src={photo} alt="" priority sizes="50vw" className="absolute inset-0 opacity-50" />
        <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${tone.overlay}`} />
        <div aria-hidden className={`absolute -bottom-24 -right-24 h-96 w-96 animate-float rounded-full blur-3xl ${tone.glow}`} />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          {/* Marca: logo 3D + nome em letra de assinatura. O 3D é decorativo
              (o nome já identifica o link). */}
          <Link
            href="/"
            aria-label="Emacrescere - voltar ao início"
            className="group -ml-4 -mt-6 inline-flex w-fit items-center gap-1"
          >
            <Scene3D
              scene="logo"
              poster="logo-heart"
              alt=""
              className="h-28 w-28 flex-none xl:h-32 xl:w-32"
            />
            <span
              className={`${signature.className} text-6xl leading-none text-brand-50 transition-colors duration-200 group-hover:text-white xl:text-7xl`}
            >
              Emacrescere
            </span>
          </Link>

          <div className="max-w-md">
            {badge && (
              <span
                className="inline-flex animate-rise items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur"
                style={d(100)}
              >
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                {badge}
              </span>
            )}

            <h1 className="mt-5 animate-rise font-display text-4xl font-semibold leading-tight" style={d(200)}>
              {headline}
            </h1>
            <p className="mt-4 animate-rise text-base leading-relaxed text-white/80" style={d(300)}>
              {lead}
            </p>

            {points.length > 0 && (
              <ul className="mt-10 space-y-4">
                {points.map((p, i) => {
                  const item = typeof p === "string" ? { title: p, desc: "" } : p;
                  return (
                    <li key={item.title} className="flex animate-rise gap-3" style={d(450 + i * 120)}>
                      <span className={`mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full ring-1 ${tone.check}`}>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      </span>
                      <div>
                        <p className={item.desc ? "text-sm font-semibold" : "text-sm text-white/90"}>{item.title}</p>
                        {item.desc && <p className="text-xs leading-relaxed text-white/70">{item.desc}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="text-xs text-white/60">
            {footnote ?? <>© {new Date().getFullYear()} Emacrescere. Todos os direitos reservados.</>}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-6 py-6 sm:px-10 lg:hidden">
          <Logo />
          <Link href={mobileLink.href} className="text-sm text-slate-600 hover:text-slate-900">
            {mobileLink.label}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10 lg:py-12">
          <div className={`w-full ${wide ? "max-w-md" : "max-w-sm"} animate-rise`} style={d(150)}>
            <div className="hidden lg:mb-8 lg:block">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Voltar para o início
              </Link>
            </div>

            {eyebrow && (
              <span className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tone.eyebrow}`}>
                {eyebrow}
              </span>
            )}
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</div>

            <div className="mt-8">{children}</div>
            {after}
          </div>
        </div>
      </div>
    </main>
  );
}
