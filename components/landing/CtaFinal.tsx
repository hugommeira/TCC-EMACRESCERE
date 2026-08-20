import Link from "next/link";

export function CtaFinal() {
  return (
    <section className="relative overflow-hidden bg-ink-950">
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-teal-500 to-sky-500 px-6 py-16 sm:px-12 sm:py-20">
          {/* Decorative blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Pronto para começar sua{" "}
              <span className="block sm:inline">jornada de emagrecimento?</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/90 sm:text-lg">
              Consulta online, prescrição digital e entrega em casa.<br className="hidden sm:block" />
              Tudo com acompanhamento médico e segurança.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-brand-700 shadow-lg shadow-black/20 transition-all duration-200 hover:bg-brand-50 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/40"
              >
                Agendar consulta agora
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#faq"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                Tirar dúvidas
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
