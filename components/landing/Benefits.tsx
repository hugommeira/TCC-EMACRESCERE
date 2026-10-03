import { Reveal } from "./motion/Reveal";
import { Photo } from "./Photo";
import { PHOTOS } from "./photos";

const BENEFITS = [
  {
    title: "Médicos com CRM verificado",
    description:
      "Cada médico é aprovado pela equipe depois de conferida a situação do CRM.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 11l-3 3-1.5-1.5" />
      </svg>
    ),
  },
  {
    title: "Receita com assinatura digital",
    description:
      "Se o médico indicar, ele emite a receita na plataforma, assinada com o certificado digital dele, com data de validade.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Farmácias autorizadas",
    description:
      "Caso o médico prescreva, você compra em qualquer farmácia autorizada — sempre com receita válida.",
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
      "Acompanhe seu progresso, suas consultas e receitas, e converse com seu médico pelo chat da consulta.",
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
    // Antes: "Orientação nutricional — guias e suporte sobre alimentação". Não
    // existe esse recurso no sistema; o benefício real aqui é o reembolso.
    title: "Reembolso ao cancelar",
    description:
      "Cancelando com 24 h ou mais de antecedência, o valor volta integralmente pela mesma forma de pagamento.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
    ),
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            Por que Emacrescere
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Segurança e praticidade em cada etapa
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Plataforma de telessaúde com médicos de CRM conferido pela equipe e
            tecnologia em conformidade com a LGPD.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Coluna de foto: dá rosto ao que os cards descrevem */}
          <Reveal
            as="li"
            variant="clip"
            className="relative min-h-[380px] overflow-hidden rounded-3xl md:col-span-2 lg:col-span-1 lg:row-span-3"
          >
            <Photo
              src={PHOTOS.videoCall}
              alt="Médica em videochamada pelo notebook"
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="absolute inset-0"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                Consulta por vídeo
              </span>
              <p className="mt-4 font-display text-2xl font-semibold leading-snug text-white">
                No horário marcado, o médico chama você na sala.
              </p>
            </div>
          </Reveal>

          {BENEFITS.map((b, i) => (
            <Reveal
              as="li"
              key={b.title}
              delay={(i % 2) * 120}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-colors duration-300 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <span
                aria-hidden
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-brand-100 to-teal-100 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />

              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-300 group-hover:from-brand-500 group-hover:to-teal-500 group-hover:text-white group-hover:ring-transparent">
                {b.icon}
              </span>

              <h3 className="relative mt-5 text-base font-semibold text-slate-900">
                {b.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                {b.description}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
