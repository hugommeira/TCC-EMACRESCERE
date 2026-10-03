import Link from "next/link";
import { Reveal } from "./motion/Reveal";

export function CtaFinal({ priceLabel }: { priceLabel: string }) {
  return (
    <section aria-labelledby="cta-titulo" className="bg-white py-24 sm:py-32">
      <Reveal className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2
          id="cta-titulo"
          className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink-950 sm:text-6xl"
        >
          Comece pelo seu perfil. O médico conduz o resto da conversa.
        </h2>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/auth/register"
            className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-brand-600 px-9 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40"
          >
            Criar minha conta
          </Link>
          <a
            href="#faq"
            className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-ink-200 px-9 text-base font-semibold text-ink-800 transition-colors duration-200 hover:border-ink-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-200"
          >
            Tirar dúvidas
          </a>
        </div>

        <p className="mt-6 text-sm text-ink-500">
          {priceLabel} por consulta. A Emacrescere não vende, indica ou dispensa medicamentos.
        </p>
      </Reveal>
    </section>
  );
}
