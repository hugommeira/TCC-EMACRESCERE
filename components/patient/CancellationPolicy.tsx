import { CANCELLATION_POLICY_TEXT } from "@/lib/scheduling";

/**
 * A política de cancelamento, visível antes de pagar. Cobrar (ou reter) em
 * cancelamento de última hora só vale se o consumidor foi informado antes —
 * por isso ela aparece junto do pagamento, e não só nos Termos.
 */
export function CancellationPolicy({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200 ${className}`}>
      <strong className="text-slate-800">Política de cancelamento.</strong> {CANCELLATION_POLICY_TEXT}
    </div>
  );
}
