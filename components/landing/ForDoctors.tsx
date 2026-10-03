import Link from "next/link";
import { Photo } from "./Photo";
import { PHOTOS } from "./photos";
import { Reveal } from "./motion/Reveal";
import { Scene3D } from "@/components/three/Scene3D";

// A área profissional é outra experiência (fila, prontuário, prescrição),
// não o painel do paciente com outra cor. Aqui ela ganha a sua vitrine.
const FEATURES = [
  "Fila de pacientes e consultas agendadas",
  "Prontuário e exames enviados pelo paciente",
  "Prescrição com busca na base da ANVISA",
  "Receita assinada com o seu certificado A1 (ICP-Brasil)",
];

export function ForDoctors() {
  return (
    <section id="para-medicos" aria-labelledby="para-medicos-titulo" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative grid overflow-hidden rounded-3xl bg-ink-950 lg:grid-cols-2">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl"
          />

          <div className="relative px-6 py-14 sm:px-12 lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
              Para médicos
            </p>
            <h2
              id="para-medicos-titulo"
              className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Uma área profissional feita para o atendimento
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-200">
              Cadastre-se com o seu CRM. Depois da aprovação da equipe, você
              atende por vídeo e registra tudo na própria plataforma.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <Reveal
                  as="li"
                  key={f}
                  delay={i * 90}
                  className="flex gap-3 rounded-xl bg-white/5 p-3 text-sm text-ink-100 ring-1 ring-white/10"
                >
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-none text-brand-300" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  {f}
                </Reveal>
              ))}
            </ul>

            <Link
              href="/auth/register/medico"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/40"
            >
              Cadastrar como médico
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <Reveal variant="clip" className="relative min-h-[320px] lg:min-h-full">
            <Photo
              src={PHOTOS.doctorDesk}
              alt="Médico em consulta online pelo notebook"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/20 to-transparent lg:via-transparent" />
            {/* Selo 3D: receitas com assinatura digital */}
            <Scene3D
              scene="seal"
              poster="seal-signature"
              alt="Selo de assinatura digital"
              className="absolute bottom-4 right-4 h-28 w-28 drop-shadow-2xl sm:h-36 sm:w-36 lg:bottom-8 lg:right-8 lg:h-44 lg:w-44"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
