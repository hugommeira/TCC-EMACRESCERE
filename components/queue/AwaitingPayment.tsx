"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  consultationId: string;
  pixQrCode:      string | null;
  pixCopyPaste:   string | null;
  amount:         number;
  isMock:         boolean;
}

export function AwaitingPayment({
  consultationId,
  pixQrCode,
  pixCopyPaste,
  amount,
  isMock,
}: Props) {
  const router = useRouter();
  const [copied,    setCopied]    = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Polling do status — quando pago, o /api/queue/position vai mudar
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/queue/position?id=${consultationId}`, { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (data.status === "WAITING" || data.status === "IN_PROGRESS") {
          router.refresh();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [consultationId, router]);

  function copy() {
    if (!pixCopyPaste) return;
    void navigator.clipboard.writeText(pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function simulate() {
    setSimulating(true);
    setError(null);
    try {
      const r = await fetch("/api/dev/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ consultationId }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.message ?? "Erro ao simular pagamento");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 p-6 ring-1 ring-brand-200">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            Pagamento via PIX
          </p>
          <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
            R$ {amount.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {pixQrCode && (
          <div className="mx-auto mt-4 flex justify-center">
            <div className="rounded-2xl bg-white p-3 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pixQrCode}`}
                alt="QR Code PIX"
                className="h-48 w-48"
              />
            </div>
          </div>
        )}

        {pixCopyPaste && (
          <button
            type="button"
            onClick={copy}
            className="mt-4 w-full cursor-pointer rounded-xl border border-brand-300 bg-white px-3 py-2.5 text-xs font-mono text-slate-700 transition-colors hover:bg-brand-50"
          >
            {copied ? "Copiado ✓" : "Copiar código PIX"}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <circle cx="12" cy="12" r="10" className="opacity-25" />
          <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
        </svg>
        Aguardando confirmação...
      </div>

      {isMock && (
        <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Modo teste ativo
          </p>
          <p className="mt-1 text-xs text-amber-900">
            ASAAS não está configurado. Use o botão abaixo para simular a confirmação do pagamento.
          </p>
          <button
            type="button"
            onClick={() => void simulate()}
            disabled={simulating}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {simulating ? (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <circle cx="12" cy="12" r="10" className="opacity-25" />
                  <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
                </svg>
                Confirmando...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Simular pagamento confirmado
              </>
            )}
          </button>
          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
