"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Error boundary da área do paciente (falha ao carregar ou renderizar uma página desta área). */
export default function PatientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} voltarHref="/dashboard/patient" voltarLabel="Voltar ao painel" />;
}
