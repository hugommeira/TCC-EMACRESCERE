"use client";

import { Button } from "./Button";
import { cn }     from "@/lib/utils";

interface PaginationProps {
  page:       number;
  pages:      number;
  total:      number;
  limit:      number;
  onNext:     () => void;
  onPrev:     () => void;
  onPage:     (p: number) => void;
  className?: string;
}

export function Pagination({
  page, pages, total, limit,
  onNext, onPrev, onPage,
  className,
}: PaginationProps) {
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  // Generate page numbers (max 5 visible)
  const range: number[] = [];
  const delta = 2;
  const left  = Math.max(1, page - delta);
  const right = Math.min(pages, page + delta);
  for (let i = left; i <= right; i++) range.push(i);

  if (pages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-between gap-4 text-sm", className)}>
      <p className="text-gray-500">
        {from}–{to} de {total} registros
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          ‹
        </Button>

        {left > 1 && (
          <>
            <PageBtn n={1} current={page} onClick={onPage} />
            {left > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}

        {range.map((n) => (
          <PageBtn key={n} n={n} current={page} onClick={onPage} />
        ))}

        {right < pages && (
          <>
            {right < pages - 1 && <span className="px-1 text-gray-400">…</span>}
            <PageBtn n={pages} current={page} onClick={onPage} />
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= pages}
          aria-label="Próxima página"
        >
          ›
        </Button>
      </div>
    </div>
  );
}

function PageBtn({
  n, current, onClick,
}: {
  n: number; current: number; onClick: (n: number) => void;
}) {
  return (
    <button
      onClick={() => onClick(n)}
      aria-current={n === current ? "page" : undefined}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
        n === current
          ? "bg-brand-600 text-white"
          : "text-gray-600 hover:bg-gray-100",
      )}
    >
      {n}
    </button>
  );
}
