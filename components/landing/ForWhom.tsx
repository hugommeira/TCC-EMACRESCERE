import Image from "next/image";
import Link from "next/link";

const REASONS = [
  {
    title: "Você já tentou dietas sem sucesso",
    description:
      "Acompanhamento médico real e contínuo, com plano individualizado para o seu corpo e rotina.",
  },
  {
    title: "Tem IMC acima de 27 ou comorbidades",
    description:
      "Avaliação especializada com médicos focados em obesidade e doenças metabólicas, para um plano individualizado.",
  },
  {
    title: "Quer um processo digital e prático",
    description:
      "Tudo pelo app: consulta, receita pelo Portal CFM, entrega em casa e acompanhamento 24h.",
  },
  {
    title: "Busca segurança e profissionais sérios",
    description:
      "Médicos com CRM ativo, prescrição CFM 2.314/2022 e farmácias auditadas em todo Brasil.",
  },
];

export function ForWhom() {
  return (
    <section
      id="para-quem"
      className="relative overflow-hidden bg-gradient-to-b from-white to-brand-50/40 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-12 lg:px-8">
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-900/5">
            <Image
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80"
              alt="Refeição saudável com vegetais frescos e ingredientes naturais"
              width={900}
              height={1100}
              className="aspect-[4/5] w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent"
            />

            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 2v6M12 22v-6M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    Acompanhamento médico
                  </p>
                  <p className="text-xs text-slate-600">
                    Resultado seguro e duradouro
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 lg:col-span-7 lg:mt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Para quem
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Feito para quem busca emagrecimento com saúde
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Cadastre-se como paciente e tenha acesso a uma jornada completa,
            do diagnóstico à entrega.
          </p>

          <ul className="mt-10 space-y-5">
            {REASONS.map((r) => (
              <li key={r.title} className="flex gap-4">
                <span className="mt-1 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {r.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link
              href="/auth/register"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-brand-500/40 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
            >
              Quero ser paciente
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="mt-3 text-xs text-slate-500">
              Médicos e farmácias parceiros são cadastrados pela equipe
              Emaerescere.{" "}
              <a href="#contato" className="font-medium text-brand-700 hover:underline">
                Fale conosco
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
