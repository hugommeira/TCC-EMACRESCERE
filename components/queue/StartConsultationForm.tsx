"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const IS_MOCK = process.env["NEXT_PUBLIC_PAYMENT_MOCK"] === "true";

export function StartConsultationForm({ feeBRL }: { feeBRL: number }) {
  const router = useRouter();
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [method, setMethod] = useState<"PIX" | "BOLETO">("PIX");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (chiefComplaint.trim().length < 3) {
      setError("Descreva o motivo da consulta");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/queue/enter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chiefComplaint, method }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Erro ao solicitar consulta");
        return;
      }
      router.push(`/dashboard/patient/queue/${json.consultation.id}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {IS_MOCK && (
        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
          <strong className="font-semibold">Modo teste:</strong> ASAAS não está configurado. Você poderá simular o pagamento na próxima tela.
        </div>
      )}

      <div>
        <label htmlFor="cc" className="block text-sm font-medium text-slate-800">
          Motivo da consulta <span className="text-red-500">*</span>
        </label>
        <textarea
          id="cc"
          rows={3}
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="Ex.: tenho IMC 32, gostaria de avaliar tratamento para emagrecimento..."
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-800">Forma de pagamento</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(["PIX","BOLETO"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                method === m
                  ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {m === "PIX" ? "PIX (instantâneo)" : "Boleto"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-slate-600">Valor da consulta</span>
          <span className="font-display text-2xl font-semibold text-slate-900">
            R$ {feeBRL.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Gerando cobrança..." : "Pagar e entrar na fila"}
      </button>

      <p className="text-center text-[11px] text-slate-400">
        Após o pagamento confirmado você entra automaticamente na fila.
      </p>
    </form>
  );
}
