import Link from "next/link";
import Image from "next/image";
import { PHOTOS } from "./photos";

// Atraso de cada peça da sequência de entrada (ms). Uma só orquestração na
// página: o resto do site só se move quando a pessoa rola ou interage.
const d = (ms: number) => ({ animationDelay: `${ms}ms` });

export function Hero() {
  return (
    <section className="relative bg-white pt-20 lg:pt-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-24">
        <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-6 lg:py-10">
          <p
            className="inline-flex w-fit animate-rise items-center gap-2 rounded-full bg-brand-100/70 px-3 py-1.5 text-[13px] font-medium text-brand-800"
            style={d(100)}
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-brand-600" />
            Telessaúde para obesidade e saúde metabólica
          </p>

          <h1
            className="mt-6 animate-rise text-balance font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-950 sm:text-6xl lg:text-[4.6rem]"
            style={d(220)}
          >
            Cuide da sua saúde metabólica com acompanhamento médico
          </h1>

          <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-ink-600" style={d(340)}>
            Médicos especialistas em obesidade e doenças metabólicas, por vídeo,
            na fila on-demand ou com hora marcada. Se o médico indicar, a receita
            sai assinada digitalmente por ele.
          </p>

          <div className="mt-9 flex animate-rise flex-col gap-3 sm:flex-row" style={d(460)}>
            <Link
              href="/auth/register"
              className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-brand-600 py-2 pl-7 pr-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40"
            >
              Começar minha jornada
              <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-ink-200 bg-white px-7 text-base font-semibold text-ink-800 transition-colors duration-200 hover:border-ink-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-200"
            >
              Como funciona
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg animate-rise grid-cols-3 gap-6" style={d(580)}>
            <Stat value="24 h" label="pra cancelar sem custo" />
            <Stat value="CRM"  label="verificado de cada médico" />
            <Stat value="LGPD" label="dados protegidos" />
          </dl>

          <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink-500">
            A Emacrescere é uma plataforma de telessaúde. Não vende, dispensa ou
            indica medicamentos. Toda conduta clínica é decisão exclusiva do
            médico responsável, em consulta individualizada.
          </p>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-t border-ink-100 pt-4">
      <dt className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">{value}</dt>
      <dd className="mt-1 text-xs leading-snug text-ink-500 sm:text-[13px]">{label}</dd>
    </div>
  );
}

/**
 * A foto com a curva de evolução do peso se desenhando por cima: é o gráfico
 * que paciente e médico veem no painel, não um enfeite genérico.
 */
function HeroVisual() {
  return (
    <div
      className="relative h-[420px] animate-scale-in overflow-hidden rounded-[28px] bg-brand-900 sm:h-[520px] lg:h-[680px] lg:rounded-tl-[160px]"
      style={d(0)}
    >
      <Image
        src={PHOTOS.hero}
        alt="Pessoa medindo a glicemia com lanceta e glicosímetro"
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink-950/5 via-ink-950/15 to-brand-950/85" />

      <svg
        aria-hidden
        viewBox="0 0 620 300"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[34%] h-[38%] w-full"
        fill="none"
      >
        <path
          d="M0 70 C 90 60, 130 110, 200 120 S 320 150, 380 185 S 500 230, 620 250"
          pathLength={1}
          stroke="#5EEAD4"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="1"
          className="animate-draw"
          style={d(600)}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <Pin className="left-[22%] top-[44%]" delay={1300}>CRM verificado</Pin>
      <Pin className="left-[40%] top-[56%] hidden sm:inline-flex" delay={1650}>Receita com assinatura digital</Pin>

      <div
        className="absolute bottom-4 left-4 right-4 animate-rise rounded-[22px] bg-white p-5 shadow-[0_24px_48px_-16px_rgba(2,44,34,0.45)] sm:bottom-8 sm:left-8 sm:right-auto sm:w-[340px]"
        style={d(1900)}
      >
        <p className="text-[15px] font-semibold text-ink-950">Evolução do peso</p>
        <p className="mt-1 text-[13px] leading-snug text-ink-600">
          O mesmo gráfico que o seu médico vê, consulta a consulta.
        </p>
        <svg aria-hidden viewBox="0 0 300 64" className="mt-3 h-14 w-full" fill="none">
          <path d="M0 14 C 50 12, 70 28, 110 30 S 190 42, 220 48 S 270 54, 300 56 V64 H0Z" fill="#10B981" fillOpacity={0.12} />
          <path d="M0 14 C 50 12, 70 28, 110 30 S 190 42, 220 48 S 270 54, 300 56" stroke="#059669" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function Pin({ children, className, delay }: { children: string; className: string; delay: number }) {
  return (
    <span
      className={`absolute inline-flex animate-rise items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-ink-800 shadow-sm backdrop-blur ${className}`}
      style={d(delay)}
    >
      <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
      {children}
    </span>
  );
}
