"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface StatsRefresherProps {
  intervalMs?: number;
}

/**
 * Componente client que revalida a página admin a cada N segundos.
 * Montado em layouts que precisam de dados "ao vivo".
 */
export function StatsRefresher({ intervalMs = 60_000 }: StatsRefresherProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null; // sem renderização
}
