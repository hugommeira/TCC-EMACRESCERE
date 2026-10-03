import { Reveal } from "./motion/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Preencha seu perfil",
    description:
      "Informe seu histórico de saúde, peso, objetivos e disponibilidade para consulta.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Consulte um médico",
    description:
      "Agende com um especialista, que avalia seu caso e, se indicado, emite a receita na plataforma, assinada digitalmente.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Acompanhamento contínuo",
    description:
      "Tire dúvidas com seu médico pelo app, registre sua evolução e mantenha a saúde em dia.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
        <path d="M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Dispensação em farmácia",
    description:
      "Caso o seu médico decida prescrever, você adquire o medicamento em farmácias autorizadas com a receita emitida.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 7l9-4 9 4M3 7v10l9 4 9-4V7M3 7l9 4 9-4M12 11v10" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-slate-50/60 py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Como funciona
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Simples, rápido e 100% online
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Do cadastro ao acompanhamento, em 4 passos. A conduta — incluindo
            se haverá ou não medicamento — é sempre decisão do seu médico.
          </p>
          <p className="mt-2 text-sm text-slate-500 sm:hidden">
            Arraste para ver os 4 passos.
          </p>
        </div>

        {/* Phone: horizontal snap rail (scanning 4 stacked cards costs a lot of
            scrolling). Tablet and up: the original grid. */}
        <ol className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal
              as="li"
              key={step.n}
              delay={i * 120}
              className="group relative w-[78%] flex-none snap-center overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-shadow duration-300 sm:w-auto sm:flex-auto hover:sm:shadow-xl hover:sm:shadow-brand-900/5 hover:sm:ring-brand-200"
            >
              {/* faixa de cor que acende no hover */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-teal-500 transition-transform duration-500 ease-out-expo group-hover:scale-x-100"
              />
              <span
                aria-hidden
                className="absolute right-4 top-3 font-display text-6xl font-semibold leading-none text-slate-100 transition-colors duration-300 group-hover:text-brand-100"
              >
                {step.n}
              </span>

              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-300 group-hover:from-brand-500 group-hover:to-teal-500 group-hover:text-white group-hover:ring-transparent">
                {step.icon}
              </span>

              <h3 className="relative mt-5 text-base font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                {step.description}
              </p>

              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute right-0 top-1/2 hidden h-px w-6 -translate-y-1/2 translate-x-1/2 bg-gradient-to-r from-transparent via-brand-300 to-transparent lg:block"
                />
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
