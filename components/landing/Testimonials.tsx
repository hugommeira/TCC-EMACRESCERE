import { Reveal } from "./motion/Reveal";

// Histórias ILUSTRATIVAS, rotuladas como tal na página. A versão anterior
// trazia nomes, fotos de banco de imagem e nota 5 como se fossem pacientes
// reais — depoimento inventado apresentado como verdadeiro. Estas descrevem
// o uso real da plataforma (horário marcado, peso no painel, receita,
// reembolso) sem prometer resultado.
const REVIEWS = [
  {
    name: "Rosângela, 52",
    role: "Professora, Volta Redonda (RJ)",
    quote:
      "Trabalho de manhã e à tarde, então escolhi o horário das 19h na agenda da médica. Na hora marcada ela me chamou, sem ficar esperando em fila.",
  },
  {
    name: "Marcos, 44",
    role: "Motorista de aplicativo, Belo Horizonte (MG)",
    quote:
      "Gosto de ver o peso de cada consulta no painel. A médica olha o mesmo gráfico que eu e a gente conversa em cima dele.",
  },
  {
    name: "Juliana, 37",
    role: "Analista administrativa, Curitiba (PR)",
    quote:
      "Precisei remarcar uma consulta e cancelei dois dias antes. O dinheiro voltou no Pix e marquei outro dia sem complicação.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Como é usar a plataforma
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Três situações do dia a dia
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Histórias ilustrativas, com personagens fictícios, que mostram como
            a agenda, o painel e o reembolso funcionam. Não são depoimentos de
            pacientes reais, e resultados clínicos variam de pessoa para pessoa.
          </p>
        </div>

        {/* Phone: one testimonial at a time on a snap rail, instead of three
            long quotes stacked. Tablet and up: the original grid. */}
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-1 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <Reveal
              as="li"
              key={r.name}
              delay={i * 120}
              className="flex w-[85%] flex-none snap-center flex-col rounded-3xl bg-gradient-to-br from-brand-50/60 via-white to-white p-6 ring-1 ring-slate-900/5 sm:w-auto sm:p-7"
            >
              <blockquote className="flex-1 text-base leading-relaxed text-slate-700">
                &ldquo;{r.quote}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <span aria-hidden className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                  {r.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                  <p className="truncate text-xs text-slate-600">{r.role} · personagem ilustrativo</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
