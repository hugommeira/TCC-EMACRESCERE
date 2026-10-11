"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Error boundary do painel administrativo (falha ao carregar ou renderizar uma página desta área). */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} voltarHref="/dashboard/admin" voltarLabel="Voltar ao painel" />;
}
