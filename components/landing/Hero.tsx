import Link from "next/link";
import Image from "next/image";
import { Photo } from "./Photo";
import { PHOTOS } from "./photos";

// Atraso de cada peça da sequência de entrada (ms).
const d = (ms: number) => ({ animationDelay: `${ms}ms` });

// "saúde metabólica" em degradê é a assinatura do site; o brilho passa
// devagar pelo texto (parado para quem pede menos movimento).
const GRADIENT_TEXT =
  "animate-shimmer bg-gradient-to-r from-brand-600 via-teal-500 to-brand-600 bg-[length:200%_auto] bg-clip-text text-transparent";

const PRIMARY_CTA =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 font-semibold text-white shadow-lg shadow-brand-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30";

export function Hero() {
  return (
    <>
      <MobileHero />
      <DesktopHero />
    </>
  );
}

/**
 * Mobile hero: full-bleed photo running under the fixed header, copy below.
 * Deliberately not a shrunken desktop — the desktop layout is a 12-col grid
 * with floating cards that collapse into a cramped stack on a phone.
 */
function MobileHero() {
  return (
    <section className="relative lg:hidden">
      <div className="relative h-[56vh] min-h-[360px] max-h-[540px] w-full animate-scale-in overflow-hidden">
        <Image
          src={PHOTOS.hero}
          alt="Pessoa medindo a glicemia com lanceta e glicosímetro"
          fill
          priority
          // hidden on desktop: ask for the smallest candidate there
          sizes="(min-width: 1024px) 1px, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-slate-900/25 via-slate-900/0 to-white"
        />
        <span
          className="absolute bottom-5 left-4 inline-flex animate-rise items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur"
          style={d(500)}
        >
          <LiveDot />
          Telessaúde para obesidade
        </span>
      </div>

      <div className="px-4 pb-14">
        <h1
          className="animate-rise font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl"
          style={d(150)}
        >
          Cuide da sua <span className={GRADIENT_TEXT}>saúde metabólica</span>{" "}
          com acompanhamento médico
        </h1>

        <p className="mt-4 animate-rise text-base leading-relaxed text-slate-600" style={d(260)}>
          Conectamos você a médicos especialistas em obesidade e doenças
          metabólicas, por vídeo, na fila on-demand ou com hora marcada. Se o
          médico indicar, a receita sai assinada digitalmente por ele.
        </p>

        <div className="mt-7 flex animate-rise flex-col gap-3" style={d(370)}>
          <Link href="/auth/register" className={`${PRIMARY_CTA} min-h-[52px] px-7 text-base`}>
            Começar minha jornada
            <Arrow />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-7 text-base font-semibold text-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Como funciona
          </a>
        </div>

        <dl
          className="mt-8 grid animate-rise grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white py-3.5 shadow-sm"
          style={d(480)}
        >
          <StatCompact value="24 h" label="Cancela grátis" />
          <StatCompact value="CRM"  label="Verificado" />
          <StatCompact value="LGPD" label="Protegido" />
        </dl>

        <p className="mt-5 text-[11px] leading-relaxed text-slate-500">
          A Emacrescere é uma plataforma de telessaúde. Não vende, dispensa ou
          indica medicamentos. Toda conduta clínica é decisão exclusiva do
          médico responsável, em consulta individualizada.
        </p>
      </div>
    </section>
  );
}

function StatCompact({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 text-center">
      <dt className="font-display text-base font-bold text-brand-700">{value}</dt>
      <dd className="mt-0.5 text-[11px] leading-tight text-slate-500">{label}</dd>
    </div>
  );
}

function DesktopHero() {
  return (
    <section className="relative hidden overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white lg:block">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[520px] w-[520px] rounded-full bg-brand-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-teal-200/30 blur-3xl"
      />
      {/* trama de pontos discreta atrás do texto */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgb(16_185_129/0.18)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-12 items-center gap-8 px-8 pb-24 pt-32">
        <div className="col-span-7">
          <span
            className="inline-flex animate-rise items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur"
            style={d(100)}
          >
            <LiveDot />
            Telessaúde para acompanhamento de obesidade
          </span>

          <h1
            className="mt-5 animate-rise font-display text-[4.25rem] font-semibold leading-[1.04] tracking-tight text-slate-900 xl:text-[4.6rem]"
            style={d(200)}
          >
            Cuide da sua <span className={GRADIENT_TEXT}>saúde metabólica</span>{" "}
            com acompanhamento médico
          </h1>

          <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-slate-600" style={d(320)}>
            Conectamos você a médicos especialistas em obesidade e doenças
            metabólicas, por vídeo, na fila on-demand ou com hora marcada. Se
            o médico indicar, a receita sai assinada digitalmente por ele.
          </p>

          <div className="mt-10 flex animate-rise gap-3" style={d(440)}>
            <Link href="/auth/register" className={`${PRIMARY_CTA} px-7 py-3.5 text-base`}>
              Começar minha jornada
              <Arrow />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Como funciona
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg animate-rise grid-cols-3 gap-x-6" style={d(560)}>
            <Stat value="24 h" label="Pra cancelar sem custo" />
            <Stat value="CRM"  label="Verificado de cada médico" />
            <Stat value="LGPD" label="Dados protegidos" />
          </dl>

          <p className="mt-6 max-w-xl text-[11px] leading-relaxed text-slate-500">
            A Emacrescere é uma plataforma de telessaúde. Não vende, dispensa
            ou indica medicamentos. Toda conduta clínica é decisão exclusiva do
            médico responsável, em consulta individualizada.
          </p>
        </div>

        <div className="col-span-5">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-2 border-brand-200 pl-4">
      <dt className="font-display text-4xl font-semibold tracking-tight text-brand-700">
        {value}
      </dt>
      <dd className="mt-1 text-xs leading-relaxed text-slate-500">{label}</dd>
    </div>
  );
}

const ACTIVITY = [
  { color: "bg-brand-500",   title: "Dr. Carlos Lima",    subtitle: "Consulta iniciada · 10:01" },
  { color: "bg-teal-500",    title: "Prescrição emitida", subtitle: "Assinada digitalmente" },
  { color: "bg-emerald-500", title: "Peso registrado",    subtitle: "Evolução atualizada no painel" },
];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className="absolute -left-6 top-12 h-72 w-72 rounded-full bg-gradient-to-br from-brand-400/30 to-teal-400/20 blur-2xl"
      />

      {/* Foto */}
      <div
        className="relative animate-scale-in overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5"
        style={d(150)}
      >
        <Photo
          src={PHOTOS.activity}
          alt="Mulher caminhando na praia"
          priority
          // este bloco some abaixo de lg: celulares não baixam a foto
          sizes="(max-width: 1023px) 1px, 40vw"
          className="relative aspect-[4/5] w-full"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent" />

      </div>

      {/* Cartão "ao vivo" */}
      <div className="absolute -bottom-10 -left-8 w-[17rem] animate-rise" style={d(700)}>
        <div className="rotate-[-3deg] rounded-2xl bg-white/95 p-4 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              Emacrescere
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              <LiveDot />
              ao vivo
            </span>
          </div>

          <ul className="space-y-2">
            {ACTIVITY.map((a, i) => (
              <li
                key={a.title}
                className="flex animate-rise items-start gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2"
                style={d(1000 + i * 350)}
              >
                <span aria-hidden className={`mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full ${a.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-900">{a.title}</p>
                  <p className="truncate text-[10px] text-slate-500">{a.subtitle}</p>
                </div>
              </li>
            ))}
          </ul>

          <div
            className="mt-3 flex animate-rise items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 px-3 py-2 text-xs font-semibold text-white"
            style={d(2100)}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
            Tudo pronto
          </div>
        </div>
      </div>

      {/* Selo de verificação */}
      <div className="absolute -right-4 top-8 animate-rise" style={d(1300)}>
        <div className="animate-float">
          <div className="rotate-[6deg] rounded-2xl bg-white p-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              </span>
              <div>
                <p className="text-[11px] font-semibold leading-tight text-slate-900">CRM verificado</p>
                <p className="text-[10px] text-slate-500">Médico ativo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
    </span>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
