"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, mensagemComCampo, mensagemDeErro } from "@/lib/api-client";
import { MEASURES, MEASURE_TYPES, formatMeasure, type MeasureType } from "@/lib/measures";
import type { MeasuresHistory } from "@/services/api/measures";
import { MeasureChart } from "./MeasureChart";

/**
 * Medidas do corpo além do peso: cintura, quadril, gordura corporal e massa
 * magra, com RCEst e RCQ calculados no servidor. Sem metas e sem lembretes:
 * mostra a evolução e deixa a interpretação com o médico.
 */
export function MeasuresPanel({
  patientId, mode = "patient", consultationId,
}: {
  /** Ausente = o próprio usuário logado. */
  patientId?:      string;
  mode?:           "patient" | "doctor";
  /** Consulta em que o médico aferiu (dentro da sala). */
  consultationId?: string;
}) {
  const [data, setData]   = useState<MeasuresHistory | null>(null);
  const [erro, setErro]   = useState<string | null>(null);
  const [tipo, setTipo]   = useState<MeasureType>("waist");
  const [valor, setValor] = useState("");
  const [nota,  setNota]  = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const qs = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
      const json = await apiFetch<{ data: MeasuresHistory }>(`/api/measurements${qs}`, { cache: "no-store" });
      setData(json.data);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [patientId]);

  useEffect(() => { void carregar(); }, [carregar]);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!valor.trim()) return;
    setSalvando(true);
    setErroForm(null);
    try {
      await apiFetch("/api/measurements", {
        method: "POST",
        body: {
          type:  tipo,
          value: valor.replace(",", "."),
          ...(nota.trim() ? { note: nota.trim() } : {}),
          ...(patientId ? { patientId } : {}),
          ...(consultationId ? { consultationId } : {}),
        },
      });
      setValor("");
      setNota("");
      await carregar();
    } catch (err) {
      setErroForm(mensagemComCampo(err));
    } finally {
      setSalvando(false);
    }
  }

  async function apagar(id: string) {
    if (!window.confirm("Apagar esta medida?")) return;
    try {
      await apiFetch(`/api/measurements/${id}`, { method: "DELETE" });
      await carregar();
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }

  const def    = MEASURES[tipo];
  const pontos = data?.series[tipo] ?? [];
  const ultimo = pontos.at(-1);
  const fmtDia = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="medidas-titulo">
      <div>
        <h2 id="medidas-titulo" className="font-display text-base font-semibold text-slate-900">Outras medidas</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {mode === "doctor"
            ? "Medidas do paciente além do peso. Você pode registrar a aferição desta consulta."
            : "Acompanhe outras medidas além do peso. Interprete os valores junto com o seu médico."}
        </p>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{erro}</p>}

      {data && (data.derived.waistToHeight != null || data.derived.waistToHip != null) && (
        <dl className="grid grid-cols-2 gap-3">
          <Indicador
            label="Cintura ÷ altura (RCEst)"
            valor={data.derived.waistToHeight}
            vazio={data.derived.heightCm ? "Registre a cintura" : "Informe a altura no perfil"}
          />
          <Indicador label="Cintura ÷ quadril (RCQ)" valor={data.derived.waistToHip} vazio="Registre cintura e quadril" />
        </dl>
      )}

      <div role="tablist" aria-label="Medida" className="flex flex-wrap gap-1.5">
        {MEASURE_TYPES.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tipo === t}
            onClick={() => { setTipo(t); setErroForm(null); }}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tipo === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {MEASURES[t].label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          {ultimo
            ? <>Última: <strong className="text-slate-900">{formatMeasure(tipo, ultimo.value)}</strong> em {fmtDia(ultimo.measuredAt)}</>
            : <span className="text-slate-500">Nenhuma medida de {def.label.toLowerCase()} registrada.</span>}
        </p>
        <MeasureChart points={pontos} unit={def.unit} />
      </div>

      <form onSubmit={(e) => void registrar(e)} className="space-y-2 rounded-xl bg-slate-50 p-3">
        <p className="text-[11px] text-slate-600">{def.hint}</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-slate-600">
            {def.label} ({def.unit})
            <input
              type="text" inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder={`${def.min}–${def.max}`}
              className="mt-1 block w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
          </label>
          <label className="min-w-[10rem] flex-1 text-xs font-semibold text-slate-600">
            Observação (opcional)
            <input
              type="text" maxLength={280}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
          </label>
          <button
            type="submit"
            disabled={salvando || !valor.trim()}
            className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Registrar"}
          </button>
        </div>
        {erroForm && <p role="alert" className="text-xs font-medium text-rose-700">{erroForm}</p>}
      </form>

      {pontos.length > 0 && (
        <ul className="divide-y divide-slate-100 text-sm">
          {[...pontos].reverse().slice(0, 10).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="font-medium text-slate-900">{formatMeasure(tipo, p.value)}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {fmtDia(p.measuredAt)}{p.source === "DOCTOR" && p.recordedBy ? ` · aferida por ${p.recordedBy}` : ""}
                </span>
                {p.note && <span className="block truncate text-xs text-slate-500">{p.note}</span>}
              </span>
              {p.canDelete && (
                <button
                  type="button"
                  onClick={() => void apagar(p.id)}
                  className="flex-none cursor-pointer rounded-full px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                >
                  Apagar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Indicador({ label, valor, vazio }: { label: string; valor: number | null; vazio: string }) {
  return (
    <div className="rounded-xl bg-brand-50/60 px-3 py-2 ring-1 ring-brand-100">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-slate-900">
        {valor != null ? valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : <span className="text-xs font-normal text-slate-500">{vazio}</span>}
      </dd>
    </div>
  );
}
