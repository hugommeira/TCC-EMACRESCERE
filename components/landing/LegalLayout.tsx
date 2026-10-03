import { Header } from "./Header";
import { Footer } from "./Footer";

interface LegalLayoutProps {
  title:    string;
  subtitle: string;
  updated:  string;
  children: React.ReactNode;
}

export function LegalLayout({ title, subtitle, updated, children }: LegalLayoutProps) {
  return (
    <main className="overflow-x-hidden bg-white text-slate-900">
      <Header />
      <section className="bg-gradient-to-b from-brand-50 to-white pb-16 pt-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Documento legal
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {subtitle}
          </p>
          <p className="mt-6 text-xs text-slate-500">
            Última atualização: {updated}
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="space-y-4 text-base leading-relaxed text-slate-600 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_a]:font-medium [&_a]:text-brand-700 [&_a:hover]:underline [&_strong]:font-semibold [&_strong]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6">
          {children}
        </div>
      </article>

      <Footer />
    </main>
  );
}
