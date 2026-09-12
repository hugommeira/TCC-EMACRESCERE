"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Sticky action bar for phones: the desktop header keeps the primary CTA
 * visible at all times, but on mobile that CTA collapses into the burger menu,
 * so the thumb would have to scroll back to the top to convert.
 *
 * Appears only after the hero has scrolled away, so it never covers the hero's
 * own buttons.
 */
export function MobileCtaBar({ priceLabel }: { priceLabel: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {priceLabel} <span className="font-medium text-slate-500">/ consulta</span>
          </p>
          <p className="truncate text-xs text-slate-500">Sem espera, sem burocracia</p>
        </div>
        <Link
          href="/auth/register"
          tabIndex={visible ? 0 : -1}
          className="inline-flex min-h-[44px] flex-none items-center rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 text-sm font-semibold text-white shadow-md shadow-brand-500/25 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
        >
          Começar
        </Link>
      </div>
    </div>
  );
}
