import Link from "next/link";
import type { Route } from "next";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Plataforma",
    links: [
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Benefícios",    href: "#beneficios" },
      { label: "Quero ser paciente", href: "/auth/register" },
      { label: "Já tenho conta", href: "/auth/login" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nós", href: "#" },
      { label: "Blog",      href: "#" },
      { label: "Carreiras", href: "#" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "Central de ajuda", href: "#" },
      { label: "Contato",          href: "#" },
      { label: "Privacidade",      href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de Uso",            href: "/termos" },
      { label: "Política de Privacidade",  href: "/privacidade" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-100">
      {/* extra bottom padding on phones so the sticky CTA bar never covers the
          last row of the footer */}
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 lg:px-8 lg:pb-16">
        <div className="md:hidden">
          <Logo variant="light" />
          <p className="mt-4 text-sm leading-relaxed text-ink-200/80">
            Conectando pacientes, médicos e farmácias para emagrecimento seguro.
          </p>

          {/* Native <details>: no JS, keeps this a Server Component, and stops
              the footer from being a wall of links on a phone. */}
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {COLUMNS.map((col) => (
              <details key={col.title} className="group">
                <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                  {col.title}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-ink-200/70 transition-transform duration-200 group-open:rotate-180"
                    fill="none" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <ul className="pb-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href as Route}
                        className="flex min-h-[44px] items-center text-sm text-ink-200/80"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        <div className="hidden gap-8 md:grid md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-200/80">
              Conectando pacientes, médicos e farmácias para emagrecimento
              seguro.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2 lg:col-span-2">
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as Route}
                      className="text-sm text-ink-200/80 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance disclaimer */}
        <div className="mt-12 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <p className="text-xs leading-relaxed text-ink-200/80">
            <strong className="text-white">Aviso legal:</strong> A Emacrescere é
            uma plataforma de telessaúde e não comercializa, indica nem dispensa
            medicamentos. Toda decisão clínica e qualquer eventual prescrição são
            de responsabilidade exclusiva do médico, em consulta individualizada.
            Os depoimentos representam experiências individuais e não garantem
            resultados clínicos. Em caso de dúvidas sobre seu tratamento,
            consulte sempre seu médico. Esta plataforma respeita as normativas
            da ANVISA, da Resolução CFM 2.314/2022 e da Lei Geral de Proteção de
            Dados (LGPD).
          </p>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-200/70">
            © {new Date().getFullYear()} Emacrescere. Todos os direitos reservados.
          </p>
          {/* min-h on phones only: these are standalone links, not inline in a
              sentence, so they need a real tap area */}
          <ul className="flex flex-wrap gap-x-6 text-xs text-ink-200/70">
            <li>
              <Link href="/termos" className="inline-flex min-h-[44px] items-center hover:text-white sm:min-h-0">Termos</Link>
            </li>
            <li>
              <Link href="/privacidade" className="inline-flex min-h-[44px] items-center hover:text-white sm:min-h-0">Privacidade</Link>
            </li>
            <li>
              <a href="mailto:contato@emacrescere.com.br" className="inline-flex min-h-[44px] items-center hover:text-white sm:min-h-0">Contato</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
