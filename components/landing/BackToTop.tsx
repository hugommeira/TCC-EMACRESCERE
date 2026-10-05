"use client";

import { useEffect, useState } from "react";

/**
 * Botão "Voltar ao topo", no canto inferior direito. Aparece quando falta
 * menos de uma tela para o fim da página, para quem leu até o rodapé não ter
 * que rolar tudo de volta.
 *
 * `aboveMobileBar`: na página inicial, abaixo de `lg` a barra fixa do
 * MobileCtaBar ocupa o rodapé da tela; o botão sobe para ficar acima dela.
 */
export function BackToTop({ aboveMobileBar = false }: { aboveMobileBar?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const remaining = doc.scrollHeight - (window.scrollY + window.innerHeight);
      setVisible(window.scrollY > window.innerHeight && remaining < window.innerHeight);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg shadow-slate-900/20 transition duration-300 hover:bg-brand-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 sm:right-6 ${
        aboveMobileBar
          ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
      } ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
