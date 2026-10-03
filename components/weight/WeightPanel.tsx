"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Alert, toast } from "@/components/ui";
import { WeightChart, type ChartMetric } from "./WeightChart";
import { formatWeight, formatWeightDelta, HEIGHT_MIN_CM, HEIGHT_MAX_CM } from "@/lib/bmi";
import type { WeightHistory, WeightPoint } from "@/services/api/weight";

type RangeKey = "30d" | "90d" | "180d" | "365d" | "all";

const RANGES: { key: RangeKey; label: string; dias: number | null }[] = [
  { key: "30d",  label: "30 dias",  dias: 30 },
  { key: "90d",  label: "3 meses",  dias: 90 },
  { key: "180d", label: "6 meses",  dias: 180 },
  { key: "365d", label: "1 ano",    dias: 365 },
  { key: "all",  label: "Tudo",     dias: null },
];

interface WeightPanelProps {
  /** Ausente = o próprio usuário logado (paciente vendo o seu). */
  patientId?: string;
  /** Nome do paciente, quando é o médico olhando. */
  patientName?: string;
  /** Médico: só leitura do histórico, mas pode aferir na consulta. */
  mode?: "patient" | "doctor";
  /** Consulta em que a pesagem foi aferida (médico, dentro da sala). */
  consultationId?: string;
  className?: string;
}

export function WeightPanel({
  patientId,
  patientName,
  mode = "patient",
  consultationId,
  className,
}: WeightPanelProps) {
  const [data, setData]       = useState<WeightHistory | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]       = useState<string | null>(null);
  const [range, setRange]     = useState<RangeKey>("90d");
  const [metric, setMetric]   = useState<ChartMetric>("weight");
  const [modal, setModal]     = useState<null | "peso" | "altura">(null);

  // Busca o histórico inteiro uma vez; o filtro de período é aplicado aqui,
  // para a troca de período ser instantânea e não gerar requisição.
  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const qs  = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
      const res = await fetch(`/api/weight${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Não foi possível carregar o acompanhamento.");
      setData(json.data as WeightHistory);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }, [patientId]);

  useEffect(() => { void carregar(); }, [carregar]);

  const pontos = useMemo<WeightPoint[]>(() => {
    if (!data) return [];
    const dias = RANGES.find((r) => r.key === range)?.dias ?? null;
    if (dias == null) return data.points;
    const corte = Date.now() - dias * 24 * 60 * 60 * 1000;
    return data.points.filter((p) => new Date(p.measuredAt).getTime() >= corte);
  }, [data, range]);

  const resumo = data?.summary ?? null;
  const temAltura = resumo?.heightCm != null;

  // Variação dentro do período filtrado (não do histórico inteiro).
  const deltaPeriodo = useMemo(() => {
    if (pontos.length < 2) return null;
    const a = pontos[0]!.weightKg;
    const b = pontos[pontos.length - 1]!.weightKg;
    return Math.round((b - a) * 10) / 10;
  }, [pontos]);

  const atual = data?.summary.current ?? null;

  if (carregando) {
    return <div className={className}><div className="h-72 animate-pulse rounded-2xl bg-ink-50" /></div>;
  }

  if (erro) {
    return (
      <div className={className}>
        <Alert variant="error" title="Não foi possível carregar">{erro}</Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* ─── Números do topo ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          label="Peso atual"
          value={atual ? formatWeight(atual.weightKg) : "—"}
          hint={atual ? new Date(atual.measuredAt).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "sem registros"}
        />
        <Tile
          label="IMC"
          value={atual?.bmi ? atual.bmi.value.toFixed(1).replace(".", ",") : "—"}
          hint={atual?.bmi?.label ?? (temAltura ? "sem registros" : "informe a altura")}
        />
        <Tile
          label="No período"
          value={deltaPeriodo != null ? formatWeightDelta(deltaPeriodo) : "—"}
          hint={deltaPeriodo == null ? "precisa de 2 pesagens" : RANGES.find((r) => r.key === range)?.label ?? ""}
        />
        <Tile
          label="Meta"
          value={resumo?.goalWeightKg != null ? formatWeight(resumo.goalWeightKg) : "—"}
          hint={
            resumo?.goalWeightKg != null && atual
              ? `faltam ${formatWeight(Math.max(atual.weightKg - resumo.goalWeightKg, 0))}`
              : resumo?.healthyCeilingKg != null
                ? `sugestão: ${formatWeight(resumo.healthyCeilingKg)}`
                : "defina no perfil"
          }
        />
      </div>

      {!temAltura && (
        <div className="mt-4">
          <Alert variant="warning" title="Falta a sua altura">
            Sem a altura o IMC não pode ser calculado.{" "}
            {mode === "patient"
              ? <button type="button" className="font-semibold underline" onClick={() => setModal("altura")}>Informar agora</button>
              : "O paciente precisa informá-la no perfil."}
          </Alert>
        </div>
      )}

      {/* ─── Filtros, numa linha só, acima do gráfico ─────────────────── */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Período">
          {RANGES.map((r) => (
            <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
              {r.label}
            </Chip>
          ))}
        </div>
        <div className="flex gap-1" role="group" aria-label="Medida">
          <Chip active={metric === "weight"} onClick={() => setMetric("weight")}>Peso</Chip>
          <Chip active={metric === "bmi"} onClick={() => setMetric("bmi")} disabled={!temAltura}>IMC</Chip>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-ink-100 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-ink-800">
          {metric === "weight" ? "Evolução do peso" : "Evolução do IMC"}
          {patientName ? ` — ${patientName}` : ""}
        </h3>
        <WeightChart
          points={pontos}
          metric={metric}
          goalKg={resumo?.goalWeightKg ?? null}
        />
      </div>

      {/* ─── Ações ───────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setModal("peso")}>
          {mode === "doctor" ? "Registrar pesagem" : "Registrar peso"}
        </Button>
        {mode === "patient" && (
          <Button size="sm" variant="secondary" onClick={() => setModal("altura")}>
            Altura e meta
          </Button>
        )}
      </div>

      {/* ─── Histórico (também é a versão em tabela do gráfico) ───────── */}
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-ink-800">Histórico</h3>
        {pontos.length === 0 ? (
          <p className="text-sm text-ink-400">Nenhuma pesagem neste período.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink-100">
            <table className="w-full text-sm">
              <caption className="sr-only">Pesagens registradas no período selecionado</caption>
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th scope="col" className="px-3 py-2">Data</th>
                  <th scope="col" className="px-3 py-2">Peso</th>
                  <th scope="col" className="px-3 py-2">IMC</th>
                  <th scope="col" className="px-3 py-2">Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {[...pontos].reverse().map((p) => (
                  <tr key={p.id} className="border-t border-ink-100">
                    <td className="px-3 py-2 text-ink-800">
                      {new Date(p.measuredAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                    </td>
                    <td className="px-3 py-2 font-medium text-ink-800">{formatWeight(p.weightKg)}</td>
                    <td className="px-3 py-2 text-ink-600">
                      {p.bmi ? `${p.bmi.value.toFixed(1).replace(".", ",")} · ${p.bmi.label}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-ink-400">
                      {p.source === "DOCTOR" ? (p.recordedBy ?? "médico") : "o paciente"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RegistrarPesoModal
        open={modal === "peso"}
        onClose={() => setModal(null)}
        {...(patientId ? { patientId } : {})}
        {...(consultationId ? { consultationId } : {})}
        onSaved={() => { setModal(null); void carregar(); }}
      />
      <AlturaMetaModal
        open={modal === "altura"}
        onClose={() => setModal(null)}
        heightCm={resumo?.heightCm ?? null}
        goalWeightKg={resumo?.goalWeightKg ?? null}
        sugestao={resumo?.healthyCeilingKg ?? null}
        onSaved={() => { setModal(null); void carregar(); }}
      />
    </div>
  );
}

// ─── Peças ────────────────────────────────────────────────────────────────────

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink-900">{value}</p>
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

function Chip({
  active, disabled, onClick, children,
}: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-medium transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        disabled
          ? "cursor-not-allowed bg-ink-50 text-ink-200"
          : active
            ? "bg-brand-600 text-white"
            : "bg-ink-50 text-ink-600 hover:bg-ink-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function RegistrarPesoModal({
  open, onClose, onSaved, patientId, consultationId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  patientId?: string;
  consultationId?: string;
}) {
  const [peso, setPeso]   = useState("");
  const [data, setData]   = useState(() => new Date().toISOString().slice(0, 10));
  const [nota, setNota]   = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch("/api/weight", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: Number(peso.replace(",", ".")),
          // Data sem fuso é lida como UTC pelo servidor (convenção do projeto).
          measuredAt: `${data}T12:00:00.000Z`,
          ...(nota.trim() ? { note: nota.trim() } : {}),
          ...(patientId ? { patientId } : {}),
          ...(consultationId ? { consultationId } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Não foi possível registrar.");
      toast.success("Peso registrado.");
      setPeso(""); setNota("");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar peso" size="sm">
      <form onSubmit={salvar} className="space-y-4">
        <Input
          label="Peso (kg)" inputMode="decimal" required autoFocus
          value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="72,4"
        />
        <Input
          label="Data da pesagem" type="date" required
          value={data} onChange={(e) => setData(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
        <Input
          label="Observação (opcional)" value={nota} maxLength={280}
          onChange={(e) => setNota(e.target.value)} placeholder="Em jejum, pela manhã"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={salvando}>Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}

function AlturaMetaModal({
  open, onClose, onSaved, heightCm, goalWeightKg, sugestao,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  heightCm: number | null;
  goalWeightKg: number | null;
  sugestao: number | null;
}) {
  const [altura, setAltura] = useState(heightCm != null ? String(heightCm) : "");
  const [meta, setMeta]     = useState(goalWeightKg != null ? String(goalWeightKg).replace(".", ",") : "");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setAltura(heightCm != null ? String(heightCm) : "");
      setMeta(goalWeightKg != null ? String(goalWeightKg).replace(".", ",") : "");
    }
  }, [open, heightCm, goalWeightKg]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch("/api/patient/metrics", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm:     altura.trim() ? Number(altura) : null,
          goalWeightKg: meta.trim() ? Number(meta.replace(",", ".")) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Não foi possível salvar.");
      toast.success("Perfil atualizado.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Altura e meta" size="sm">
      <form onSubmit={salvar} className="space-y-4">
        <Input
          label="Altura (cm)" type="number" inputMode="numeric"
          min={HEIGHT_MIN_CM} max={HEIGHT_MAX_CM}
          value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="170"
          hint="Usada para calcular o IMC de todo o histórico."
        />
        <Input
          label="Meta de peso (kg)" inputMode="decimal"
          value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="72,0"
          {...(sugestao != null
            ? { hint: `Topo da faixa de peso normal para a sua altura: ${formatWeight(sugestao)}` }
            : {})}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={salvando}>Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
