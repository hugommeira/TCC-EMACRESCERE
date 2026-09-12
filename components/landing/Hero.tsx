import Link from "next/link";
import Image from "next/image";

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
      <div className="relative h-[56vh] min-h-[360px] max-h-[540px] w-full overflow-hidden">
        <Image
          src="/hero-mobile.jpg"
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
        <span className="absolute bottom-5 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          Telessaúde para obesidade
        </span>
      </div>

      <div className="px-4 pb-14">
        <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl">
          Cuide da sua{" "}
          <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
            saúde metabólica
          </span>{" "}
          com acompanhamento médico
        </h1>

        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Conectamos você a médicos especialistas em obesidade e doenças
          metabólicas. A conduta — incluindo eventual prescrição — é decidida
          pelo seu médico no Portal Oficial do CFM.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/auth/register"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-7 text-base font-semibold text-white shadow-lg shadow-brand-500/30 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
          >
            Começar minha jornada
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-7 text-base font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            Como funciona
          </a>
        </div>

        <dl className="mt-8 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white py-3.5 shadow-sm">
          <StatCompact value="+2mil" label="Pacientes" />
          <StatCompact value="100%"  label="CRM ativo" />
          <StatCompact value="LGPD"  label="Protegido" />
        </dl>

        <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
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
      <dt className="font-mono text-sm font-bold text-brand-700">{value}</dt>
      <dd className="mt-0.5 text-[11px] leading-tight text-slate-500">{label}</dd>
    </div>
  );
}

function DesktopHero() {
  return (
    <section className="relative hidden overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white lg:block">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-brand-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-teal-200/30 blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-28 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pt-32">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Telessaúde para acompanhamento de obesidade
          </span>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-[4.25rem]">
            Cuide da sua{" "}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              saúde metabólica
            </span>{" "}
            com acompanhamento médico
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Conectamos você a médicos especialistas em obesidade e doenças
            metabólicas. A conduta — incluindo eventual prescrição — é
            decidida pelo seu médico no Portal Oficial do CFM.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-brand-500/40 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
            >
              Começar minha jornada
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Como funciona
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Stat value="+2mil" label="Pacientes acompanhados" />
            <Stat value="100%"  label="Médicos com CRM ativo" />
            <Stat value="LGPD"  label="Dados protegidos" />
          </dl>

          <p className="mt-6 max-w-xl text-[11px] leading-relaxed text-slate-400">
            A Emacrescere é uma plataforma de telessaúde. Não vende, dispensa
            ou indica medicamentos. Toda conduta clínica é decisão exclusiva do
            médico responsável, em consulta individualizada.
          </p>
        </div>

        <div className="lg:col-span-5">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-3xl font-semibold tracking-tight text-brand-700 sm:text-4xl">
        {value}
      </dt>
      <dd className="mt-1 text-xs leading-relaxed text-slate-500">{label}</dd>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className="absolute -left-6 top-12 hidden h-72 w-72 rounded-full bg-gradient-to-br from-brand-400/30 to-teal-400/20 blur-2xl sm:block"
      />

      {/* Photo card */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
        <Image
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80"
          alt="Pessoa praticando atividade física com bem-estar"
          width={900}
          height={1100}
          priority
          // this block is hidden below lg: keep phones from downloading it
          sizes="(max-width: 1023px) 1px, 40vw"
          className="aspect-[4/5] w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent"
        />
      </div>

      {/* Floating phone-like card */}
      <div className="absolute -bottom-8 -left-6 w-64 rotate-[-3deg] rounded-2xl bg-white p-4 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            Emacrescere
          </span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
            ao vivo
          </span>
        </div>

        <ul className="space-y-2.5">
          <Activity color="bg-brand-500" title="Dr. Carlos Lima" subtitle="Consulta iniciada · 10:01" />
          <Activity color="bg-teal-500"  title="Prescrição emitida" subtitle="Portal Oficial CFM" />
          <Activity color="bg-emerald-500" title="Acompanhamento ativo" subtitle="Suporte pelo app" />
        </ul>

        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 px-3 py-2 text-xs font-semibold text-white">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 13l4 4L19 7" />
          </svg>
          Tudo pronto
        </div>
      </div>

      {/* Floating verification badge */}
      <div className="absolute -right-3 top-8 rotate-[6deg] rounded-2xl bg-white p-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
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
  );
}

function Activity({
  color,
  title,
  subtitle,
}: {
  color: string;
  title: string;
  subtitle: string;
}) {
  return (
    <li className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2">
      <span aria-hidden className={`mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-slate-900">{title}</p>
        <p className="truncate text-[10px] text-slate-500">{subtitle}</p>
      </div>
    </li>
  );
}
