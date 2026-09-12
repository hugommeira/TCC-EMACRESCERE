import Image from "next/image";

const REVIEWS = [
  {
    name: "Marina S., 34",
    role: "Em acompanhamento médico",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    quote:
      "O que mudou pra mim foi ter um médico que realmente acompanha o processo. Sinto que estou cuidando da minha saúde de forma humana e estruturada.",
    rating: 5,
  },
  {
    name: "Camila R., 41",
    role: "Em acompanhamento médico",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
    quote:
      "Foi rápido e seguro começar. A consulta foi atenciosa, esclareci todas as dúvidas e me senti confortável com a abordagem do meu médico.",
    rating: 5,
  },
  {
    name: "Juliana M., 29",
    role: "Em acompanhamento médico",
    avatar:
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=200&q=80",
    quote:
      "Ter alguém de confiança me orientando pelo app fez total diferença. Hoje me sinto mais segura no meu cuidado e na minha rotina.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Quem está com a gente
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            A experiência de quem deu o primeiro passo
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Depoimentos sobre a qualidade do acompanhamento médico na plataforma.
            Resultados clínicos variam conforme cada paciente.
          </p>
        </div>

        {/* Phone: one testimonial at a time on a snap rail, instead of three
            long quotes stacked. Tablet and up: the original grid. */}
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-1 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <li
              key={r.name}
              className="flex w-[85%] flex-none snap-center flex-col rounded-3xl bg-gradient-to-br from-brand-50/60 via-white to-white p-6 ring-1 ring-slate-900/5 sm:w-auto sm:p-7"
            >
              <div className="flex gap-0.5 text-amber-400" aria-label={`${r.rating} de 5 estrelas`}>
                {Array.from({ length: r.rating }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M12 2l3 6.5 7 1-5 4.9 1.2 7L12 18l-6.2 3.4L7 14.4 2 9.5l7-1z" />
                  </svg>
                ))}
              </div>

              <blockquote className="mt-4 flex-1 text-base leading-relaxed text-slate-700">
                &ldquo;{r.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <Image
                  src={r.avatar}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 flex-none rounded-full object-cover ring-2 ring-white"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                  <p className="truncate text-xs text-slate-500">{r.role}</p>
                </div>
              </figcaption>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
