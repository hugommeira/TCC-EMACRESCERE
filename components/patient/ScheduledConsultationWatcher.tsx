"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

interface Props {
  consultationId: string;
  status:         string;
  paymentStatus:  string | null;
}

/**
 * Acompanha uma consulta agendada e recarrega a página quando algo muda:
 * pagamento confirmado, médico chamou o paciente, consulta começou.
 *
 * O AwaitingPayment (fluxo da fila) só reage a status WAITING/IN_PROGRESS da
 * fila. Consulta agendada paga continua SCHEDULED, então ele nunca percebia a
 * confirmação do pagamento — o paciente ficava preso em "Aguardando" até
 * recarregar a página na mão.
 */
export function ScheduledConsultationWatcher({ consultationId, status, paymentStatus }: Props) {
  const router = useRouter();
  const current = useRef({ status, paymentStatus });
  current.current = { status, paymentStatus };

  useEffect(() => {
    let stopped = false;
    const t = setInterval(async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const json = await apiFetch<{ data?: { status: string; payment?: { status: string } | null } }>(
          `/api/consultations/${consultationId}`, { cache: "no-store" },
        );
        if (stopped) return;
        const next = {
          status:        json.data?.status ?? current.current.status,
          paymentStatus: json.data?.payment?.status ?? null,
        };
        if (next.status !== current.current.status || next.paymentStatus !== current.current.paymentStatus) {
          router.refresh();
        }
      } catch {
        // Rede instável: tenta de novo no próximo ciclo; falhas seguidas
        // acendem o aviso de conexão (ConnectionBanner).
      }
    }, 5000);
    return () => { stopped = true; clearInterval(t); };
  }, [consultationId, router]);

  return (
    <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
      </span>
      Esta página se atualiza sozinha
    </p>
  );
}
