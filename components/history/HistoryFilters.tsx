"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Route } from "next";
import { useTransition } from "react";

const STATUSES = [
  { value: "",            label: "Todas" },
  { value: "WAITING",     label: "Na fila" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "COMPLETED",   label: "Concluída" },
  { value: "CANCELLED",   label: "Cancelada" },
];

export function HistoryFilters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [, start]    = useTransition();

  const status = searchParams.get("status") ?? "";
  const q      = searchParams.get("q")      ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else       params.delete(key);
    params.delete("page");
    start(() => router.push(`${pathname}?${params.toString()}` as Route));
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Buscar por queixa ou nome..."
          defaultValue={q}
          onChange={(e) => update("q", e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => update("status", s.value)}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ${
              status === s.value
                ? "bg-brand-50 text-brand-700 ring-brand-200"
                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
