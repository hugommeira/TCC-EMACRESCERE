"use client";

import { useInView } from "./motion/Reveal";

// É de fato uma sequência, por isso a numeração. A linha de progresso se
// preenche quando a seção entra na tela e cada número acende na sua vez.
const STEPS = [
  {
    n: "01",
    title: "Crie seu perfil",
    description: "Histórico de saúde, peso, objetivos e disponibilidade. Leva poucos minutos.",
  },
  {
    n: "02",
    title: "Pague e escolha como ser atendido",
    description: "Pix, cartão ou boleto. Entre na fila on-demand ou marque um horário com o médico.",
  },
  {
    n: "03",
    title: "Consulte por vídeo",
    description: "O médico avalia seu caso e, se indicar, emite a receita assinada digitalmente.",
  },
  {
    n: "04",
    title: "Acompanhe a evolução",
    description: "Chat com o médico, registro do peso e, se houver receita, compra em farmácia autorizada.",
  },
];

export function HowItWorks() {
  const { ref, visible } = useInView<HTMLOListElement>("0px 0px -20% 0px");

  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="relative bg-ink-950 py-20 text-white sm:rounded-t-[48px] sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="como-funciona-titulo" className="font-display text-4xl font-semibold tracking-[-0.025em] sm:text-5xl">
            Como funciona
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-200">
            Do cadastro ao acompanhamento, em quatro passos. Se haverá ou não
            medicamento é sempre decisão do seu médico.
          </p>
        </div>

        <div aria-hidden className="mt-14 hidden h-px w-full bg-white/10 lg:block">
          <div
            className={`h-px origin-left bg-brand-300 transition-transform duration-[1800ms] ease-out-expo ${
              visible ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </div>

        <ol ref={ref} className="mt-10 grid gap-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.n}>
              <span
                aria-hidden
                className={`block font-display text-7xl font-semibold leading-none tracking-[-0.04em] transition-colors duration-500 sm:text-8xl ${
                  visible ? "text-brand-300" : "text-white/15"
                }`}
                style={{ transitionDelay: visible ? `${300 + i * 400}ms` : "0ms" }}
              >
                {step.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                <span className="sr-only">Passo {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-200">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
