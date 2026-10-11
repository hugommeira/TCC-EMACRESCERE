"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Error boundary da área do médico, em tom escuro (falha ao carregar ou renderizar uma página desta área). */
export default function DoctorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} voltarHref="/dashboard/doctor" voltarLabel="Voltar ao painel" escuro />;
}
