"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Error boundary da sala de consulta (falha ao carregar ou renderizar uma página desta área). */
export default function ConsultaRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} voltarHref="/" voltarLabel="Voltar ao início" />;
}
