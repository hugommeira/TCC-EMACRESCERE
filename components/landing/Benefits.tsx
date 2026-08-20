const BENEFITS = [
  {
    title: "Médicos certificados CFM",
    description:
      "Todos os médicos são registrados e habilitados para prescrever na plataforma.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 11l-3 3-1.5-1.5" />
      </svg>
    ),
  },
  {
    title: "Prescrição via Portal CFM",
    description:
      "Médicos emitem a prescrição pelo Portal Oficial do CFM (prescricaoeletronica.cfm.org.br) — válido em todo Brasil.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Rede de farmácias autorizadas",
    description:
      "Caso o médico prescreva, você dispensa em farmácias parceiras autorizadas — sempre com receita válida.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V9z" />
        <path d="M11 13h2M12 12v2" />
      </svg>
    ),
  },
  {
    title: "Acompanhamento pelo app",
    description:
      "Monitore progresso, renove prescrições e fale com seu médico 24h.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="5" y="2" width="14" height="20" rx="2.5" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
  {
    title: "Pagamento seguro",
    description:
      "Plataforma com PIX, cartão e boleto — pagamentos processados com criptografia.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    title: "Orientação nutricional",
    description:
      "Guias e suporte sobre alimentação saudável — não substitui consulta com nutricionista.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
        <path d="M9 9c1 1 2 1.5 3 1.5S14 10 15 9" />
      </svg>
    ),
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Por que Emaerescere
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Segurança e praticidade em cada etapa
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Plataforma de telessaúde com médicos certificados pelo CFM e
            tecnologia em conformidade com a LGPD.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <li
              key={b.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <span
                aria-hidden
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-brand-100 to-teal-100 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />

              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-700 ring-1 ring-brand-100">
                {b.icon}
              </span>

              <h3 className="relative mt-5 text-base font-semibold text-slate-900">
                {b.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                {b.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
