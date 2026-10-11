"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Error boundary raiz: páginas fora das áreas que têm o seu próprio error.tsx. */
export default function RootError({
  error,
  reset,
}: {
  error:  Error & { digest?: string };
  reset:  () => void;
}) {
  // Antes dizia "Nossa equipe foi notificada", mas nada era enviado a ninguém.
  return <ErrorState error={error} reset={reset} title="Algo deu errado" />;
}
