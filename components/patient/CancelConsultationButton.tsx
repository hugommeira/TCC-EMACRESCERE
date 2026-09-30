"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { CANCEL_FULL_REFUND_HOURS, patientCancelIsRefundable } from "@/lib/scheduling";

/**
 * Cancelamento pelo paciente. Antes o site não tinha como o paciente cancelar
 * uma consulta (só o app, e sem estorno nenhum). A confirmação já diz, antes
 * de o paciente decidir, se aquele cancelamento terá estorno — conforme a
 * política em lib/scheduling.ts.
 */
export function CancelConsultationButton({
  consultationId,
  scheduledAt,
  paid,
}: {
  consultationId: string;
  scheduledAt:    string;
  paid:           boolean;
}) {
  const router = useRouter();
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    const refundable = patientCancelIsRefundable(new Date(scheduledAt));
    const message = !paid
      ? "O horário será liberado para outros pacientes."
      : refundable
        ? "Como faltam mais de 24 horas, o valor pago será estornado integralmente pela mesma forma de pagamento."
        : `Faltam menos de ${CANCEL_FULL_REFUND_HOURS} horas para a consulta. Pela política de cancelamento, este cancelamento NÃO tem estorno.`;

    const ok = await confirmDialog({
      title:        "Cancelar esta consulta?",
      message,
      confirmLabel: paid && !refundable ? "Cancelar sem estorno" : "Cancelar consulta",
      // O padrão era "Cancelar", ao lado de "Cancelar consulta" — ambíguo.
      cancelLabel:  "Manter consulta",
      tone:         paid && !refundable ? "danger" : "warning",
    });
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/consultations/${consultationId}/cancel`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason: "Cancelada pelo paciente" }),
      });
      const j = await r.json().catch(() => ({} as { message?: string }));
      if (!r.ok) { setError(j.message ?? "Não foi possível cancelar"); return; }
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void cancel()}
        disabled={busy}
        className="w-full cursor-pointer rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Cancelando..." : "Cancelar consulta"}
      </button>
      {error && <p className="text-center text-xs text-rose-600">{error}</p>}
    </div>
  );
}
