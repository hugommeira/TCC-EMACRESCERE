"use client";

import { useRouter } from "next/navigation";
import { CheckoutForm } from "@/components/forms/CheckoutForm";

/**
 * Pagamento de uma consulta agendada a partir da página da consulta — pra quem
 * saiu do assistente antes de pagar, ou cuja cobrança venceu. Antes o botão
 * "Pagar →" da lista levava a uma tela que só mostrava um QR code que não
 * existia (nenhuma cobrança tinha sido gerada) e não oferecia como pagar.
 */
export function ScheduledPaymentForm({
  consultationId,
  amount,
  doctorName,
}: {
  consultationId: string;
  amount:         number;
  doctorName:     string;
}) {
  const router = useRouter();
  return (
    <CheckoutForm
      consultationId={consultationId}
      amount={amount}
      doctorName={doctorName}
      onSuccess={() => router.refresh()}
    />
  );
}
