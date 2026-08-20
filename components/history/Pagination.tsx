"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";

export function Pagination({ page, pages }: { page: number; pages: number }) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  function buildHref(p: number): Route {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}` as Route;
  }

  if (pages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);
  const startPage = Math.max(1, Math.min(page - 2, pages - 4));
  const endPage   = Math.min(pages, startPage + 4);
  const range     = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <nav className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-0" aria-label="Paginação">
      <p className="text-xs text-slate-500">
        Página <strong className="text-slate-900">{page}</strong> de {pages}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <Link
            href={buildHref(prev)}
            aria-disabled={page === 1}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
              page === 1
                ? "pointer-events-none text-slate-300"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            ‹
          </Link>
        </li>
        {range.map((p) => (
          <li key={p}>
            <Link
              href={buildHref(p)}
              aria-current={p === page ? "page" : undefined}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition-colors ${
                p === page
                  ? "bg-gradient-to-r from-brand-500 to-teal-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={buildHref(next)}
            aria-disabled={page === pages}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
              page === pages
                ? "pointer-events-none text-slate-300"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            ›
          </Link>
        </li>
      </ul>
    </nav>
  );
}
