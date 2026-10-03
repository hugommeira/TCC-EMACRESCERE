import Link from "next/link";
import type { Route } from "next";
import { Photo } from "./Photo";
import { PHOTOS } from "./photos";
import { Reveal } from "./motion/Reveal";

// Paciente e médico têm jornadas diferentes na plataforma; cada um ganha o
// seu painel, com o que de fato encontra ao entrar.
const AUDIENCES = [
  {
    id: "para-pacientes",
    eyebrow: "Para pacientes",
    title: "Acompanhamento que continua depois da consulta",
    body: "Você registra o peso, conversa com o médico pelo chat e encontra receitas e exames no mesmo painel.",
    points: [
      "Fila on-demand ou horário marcado",
      "Chat com o médico da consulta",
      "Cancelamento grátis até 24 h antes",
    ],
    cta: { label: "Criar conta de paciente", href: "/auth/register" },
    photo: PHOTOS.activity,
    alt: "Mulher caminhando na praia",
    tone: "light",
  },
  {
    id: "para-medicos",
    eyebrow: "Para médicos",
    title: "Uma área profissional feita para o atendimento",
    body: "Fila de pacientes, prontuário, anexos da consulta e prescrição com busca na base da ANVISA, assinada com o seu certificado A1.",
    points: [
      "Cadastro com CRM e aprovação da equipe",
      "Prontuário e exames enviados pelo paciente",
      "Receita assinada com ICP-Brasil",
    ],
    cta: { label: "Cadastrar como médico", href: "/auth/register/medico" },
    photo: PHOTOS.doctorDesk,
    alt: "Médico em consulta online pelo notebook",
    tone: "dark",
  },
] as const;

export function ForWhom() {
  return (
    <div>
      {AUDIENCES.map((a, i) => {
        const dark = a.tone === "dark";
        const photoFirst = i % 2 === 0;
        return (
          <section
            key={a.id}
            id={a.id}
            aria-labelledby={`${a.id}-titulo`}
            className={`grid lg:grid-cols-2 ${dark ? "bg-brand-900 text-white" : "bg-ink-50 text-ink-950"}`}
          >
            <Reveal
              variant="clip"
              className={`relative h-[320px] sm:h-[420px] lg:h-auto lg:min-h-[640px] ${photoFirst ? "" : "lg:order-2"}`}
            >
              <Photo src={a.photo} alt={a.alt} sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0" />
            </Reveal>

            <div className="flex flex-col justify-center px-4 py-16 sm:px-12 lg:px-20 lg:py-24 xl:px-24">
              <span aria-hidden className="block h-0.5 w-16 bg-brand-500" />
              <p className={`mt-6 text-[15px] font-medium ${dark ? "text-brand-200" : "text-brand-800"}`}>{a.eyebrow}</p>
              <h2
                id={`${a.id}-titulo`}
                className="mt-3 max-w-lg text-balance font-display text-4xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[2.8rem]"
              >
                {a.title}
              </h2>
              <p className={`mt-5 max-w-lg text-[17px] leading-relaxed ${dark ? "text-white/80" : "text-ink-600"}`}>{a.body}</p>

              <ul className="mt-7 space-y-3">
                {a.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-[15px]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none text-brand-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>

              <Link
                href={a.cta.href as Route}
                className="group mt-10 inline-flex w-fit min-h-[44px] items-center gap-3 rounded-full text-[15px] font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40"
              >
                {a.cta.label}
                <span
                  aria-hidden
                  className={`grid h-10 w-10 place-items-center rounded-full border transition-colors duration-200 ${
                    dark
                      ? "border-white/40 group-hover:border-white group-hover:bg-white group-hover:text-brand-900"
                      : "border-ink-200 group-hover:border-ink-950 group-hover:bg-ink-950 group-hover:text-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </div>
          </section>
        );
      })}
    </div>
  );
}
