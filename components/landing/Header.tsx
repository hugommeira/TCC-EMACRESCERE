"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#jornada",       label: "Benefícios" },
  { href: "#para-pacientes", label: "Para pacientes" },
  { href: "#para-medicos",  label: "Para médicos" },
  { href: "#faq",           label: "Perguntas" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-md shadow-[0_1px_0_0_rgba(15,23,42,0.06)]"
          : "bg-white/0"
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Logo />

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="cursor-pointer text-sm font-medium text-ink-600 transition-colors duration-200 hover:text-ink-950"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/auth/login"
            className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition-colors duration-200 hover:text-ink-950"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
          >
            Criar conta
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer rounded-lg p-2 text-ink-700 hover:bg-slate-100 lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <>
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center rounded-lg px-3 text-base font-medium text-ink-700 hover:bg-slate-50"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/auth/register"
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center justify-center rounded-full bg-brand-600 px-5 text-center text-sm font-semibold text-white"
              >
                Criar conta
              </Link>
            </li>
            {/* "Entrar" existed only in the desktop header — a returning user on
                a phone had no way in from the landing page. */}
            <li>
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 px-5 text-center text-sm font-semibold text-ink-700"
              >
                Entrar
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
