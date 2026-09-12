"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Role } from "@prisma/client";
import type { Route } from "next";

// Busca e notificações do TopBar. Os dois botões existiam desde o início
// mas não faziam nada — agora a busca leva pra lista certa de cada perfil
// (com ?q=) e o sino lista as pendências reais vindas de /api/notifications.

const SEARCH_TARGET: Record<Role, { href: string; placeholder: string }> = {
  ADMIN:       { href: "/dashboard/admin/users",          placeholder: "Buscar usuário por nome ou e-mail" },
  SUPER_ADMIN: { href: "/dashboard/admin/users",          placeholder: "Buscar usuário por nome ou e-mail" },
  DOCTOR:      { href: "/dashboard/doctor/consultations",  placeholder: "Buscar consulta por paciente" },
  PATIENT:     { href: "/dashboard/patient/consultations", placeholder: "Buscar consulta por médico" },
};

export function TopBarSearch({ role }: { role: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const target = SEARCH_TARGET[role];

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function go() {
    const q = value.trim();
    router.push((q ? `${target.href}?q=${encodeURIComponent(q)}` : target.href) as Route);
    setOpen(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    go();
  }

  return (
    <div className="flex items-center">
      {open && (
        <form onSubmit={submit} className="mr-1 hidden sm:block">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
            onBlur={() => { if (!value) setOpen(false); }}
            placeholder={target.placeholder}
            className="w-64 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            aria-label="Buscar"
          />
        </form>
      )}
      <button
        type="button"
        onClick={() => (open && value.trim() ? go() : setOpen((v) => !v))}
        className="hidden cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:inline-flex"
        aria-label="Buscar"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    </div>
  );
}

interface NotificationItem {
  id:    string;
  title: string;
  text:  string;
  href:  string;
  tone:  "brand" | "amber" | "rose" | "slate";
}

const TONE_DOT: Record<NotificationItem["tone"], string> = {
  brand: "bg-brand-500",
  amber: "bg-amber-500",
  rose:  "bg-rose-500",
  slate: "bg-slate-400",
};

const POLL_MS = 60_000;

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/notifications", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { items: NotificationItem[] };
        if (alive) {
          setItems(data.items ?? []);
          setLoaded(true);
        }
      } catch {
        // sem rede: mantém o que tinha
      }
    }
    void load();
    const t = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label={items.length > 0 ? `${items.length} notificações` : "Notificações"}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2v1h16v-1l-2-2z" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pendências
          </div>
          {!loaded ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Nada pendente por agora.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href as Route}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                  >
                    <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${TONE_DOT[n.tone]}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">{n.title}</span>
                      <span className="block text-xs text-slate-500">{n.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
