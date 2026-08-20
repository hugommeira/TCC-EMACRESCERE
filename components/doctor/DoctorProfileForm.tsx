"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  initial: {
    available:       boolean;
    consultationFee: number;
    subSpecialty:    string | null;
    bio:             string | null;
  };
}

export function DoctorProfileForm({ initial }: Props) {
  const [available,       setAvailable]    = useState(initial.available);
  const [fee,             setFee]          = useState(String(initial.consultationFee));
  const [subSpecialty,    setSubSpecialty] = useState(initial.subSpecialty ?? "");
  const [bio,             setBio]          = useState(initial.bio ?? "");
  const [saving,          setSaving]       = useState(false);
  const [savedAt,         setSavedAt]      = useState<Date | null>(null);
  const [error,           setError]        = useState<string | null>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    const t = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        const r = await fetch("/api/doctor/profile", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            available,
            consultationFee: Number(fee) || 0,
            subSpecialty: subSpecialty || undefined,
            bio:          bio          || undefined,
          }),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({} as { message?: string }));
          setError(j.message ?? "Falha ao salvar");
          return;
        }
        setSavedAt(new Date());
      } catch {
        setError("Erro de conexão");
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, fee, subSpecialty, bio]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <p className="font-display text-base font-semibold text-slate-900">Aceitar novos atendimentos</p>
          <p className="text-xs text-slate-500">
            Quando desligado, você não aparece como disponível na fila.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAvailable((v) => !v)}
          aria-pressed={available}
          className={`relative inline-flex h-7 w-12 cursor-pointer flex-none items-center rounded-full transition-colors ${
            available ? "bg-gradient-to-r from-brand-500 to-teal-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              available ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor da consulta (R$)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          />
        </Field>

        <Field label="Sub-especialidade (opcional)">
          <input
            type="text"
            value={subSpecialty}
            onChange={(e) => setSubSpecialty(e.target.value)}
            placeholder="Ex.: Endocrinologia metabólica"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          />
        </Field>
      </div>

      <Field label="Mini-bio que aparece para o paciente">
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Conte ao paciente sua formação, experiência e abordagem clínica..."
          maxLength={2000}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
        />
        <p className="mt-1 text-right text-[11px] text-slate-400">{bio.length}/2000</p>
      </Field>

      <div className="flex items-center justify-end text-[11px]">
        {error ? (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 ring-1 ring-rose-200">{error}</span>
        ) : saving ? (
          <span className="text-slate-500">Salvando...</span>
        ) : savedAt ? (
          <span className="text-emerald-600">
            ✓ Salvo {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : (
          <span className="text-slate-400">Auto-save ativo</span>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
