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
];

export function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-12">
          <div className="col-span-2 md:col-span-4">
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

          <div className="col-span-2 md:col-span-2">
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/termos"
                  className="text-sm text-ink-200/80 transition-colors duration-200 hover:text-white"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="text-sm text-ink-200/80 transition-colors duration-200 hover:text-white"
                >
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance disclaimer */}
        <div className="mt-12 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <p className="text-xs leading-relaxed text-ink-200/80">
            <strong className="text-white">Aviso legal:</strong> A Emaerescere é
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
            © {new Date().getFullYear()} Emaerescere. Todos os direitos reservados.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-200/70">
            <li>
              <Link href="/termos" className="hover:text-white">Termos</Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            </li>
            <li>
              <a href="mailto:contato@emaerescere.com.br" className="hover:text-white">Contato</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
