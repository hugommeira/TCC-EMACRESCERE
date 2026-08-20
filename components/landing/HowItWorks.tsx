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
      "Conectamos você a um especialista que avalia e emite a prescrição pelo Portal Oficial do CFM.",
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
    <section id="como-funciona" className="bg-slate-50/60 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Como funciona
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Simples, rápido e 100% online
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Em apenas 4 passos você tem a caneta de emagrecimento com prescrição
            médica em mãos.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:ring-brand-200"
            >
              <span
                aria-hidden
                className="absolute right-4 top-2 font-display text-5xl font-semibold leading-none text-slate-100 transition-colors group-hover:text-brand-100"
              >
                {step.n}
              </span>

              <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
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
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
