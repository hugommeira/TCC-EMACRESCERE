import Link from "next/link";
import type { WeightPoint, WeightSummary } from "@/services/api/weight";
import { formatWeight, formatWeightDelta } from "@/lib/bmi";

// Resumo do peso no início do paciente. A tela completa (registro, gráfico,
// metas) continua em /dashboard/patient/peso; aqui é só o retrato.
// A variação aparece em tom neutro: interpretar perda ou ganho é papel do
// médico, não do painel.

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" });

function sparkline(points: WeightPoint[], w = 280, h = 72, pad = 6) {
  const ys = points.map((p) => p.weightKg);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => [pad + i * step, pad + (1 - (p.weightKg - min) / span) * (h - pad * 2)] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1] ?? ([pad, h] as const);
  return { line, area: `${line} L${last[0].toFixed(1)} ${h} L${pad} ${h} Z`, last };
}

export function WeightSnapshot({ summary, points }: { summary: WeightSummary; points: WeightPoint[] }) {
  const current = summary.current;

  if (!current) {
    return (
      <section aria-labelledby="peso-resumo" className="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
        <div>
          <h2 id="peso-resumo" className="text-sm font-semibold text-brand-700">Peso e IMC</h2>
          <p className="mt-3 font-display text-2xl font-semibold text-slate-900">Nenhuma pesagem ainda</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Registre seu peso para acompanhar a evolução. O seu médico vê este histórico na consulta.
          </p>
        </div>
        <Link
          href="/dashboard/patient/peso"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center self-start rounded-full border border-brand-200 bg-brand-50 px-6 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
        >
          Registrar pesagem
        </Link>
      </section>
    );
  }

  const chart = points.length >= 2 ? sparkline(points) : null;

  return (
    <section aria-labelledby="peso-resumo" className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <h2 id="peso-resumo" className="text-sm font-semibold text-brand-700">Peso e IMC</h2>
        <span className="text-xs text-slate-500">
          {summary.count} {summary.count === 1 ? "pesagem" : "pesagens"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="font-display text-4xl font-semibold tracking-tight text-slate-900">{formatWeight(current.weightKg)}</p>
          <p className="mt-0.5 text-xs text-slate-500">em {dateFmt.format(new Date(current.measuredAt))}</p>
        </div>
        {current.bmi && (
          <div className="pb-1">
            <p className="text-sm text-slate-500">
              IMC <span className="font-semibold text-slate-900">{current.bmi.value.toFixed(1).replace(".", ",")}</span>
            </p>
            <p className="text-xs text-slate-500">{current.bmi.label}</p>
          </div>
        )}
      </div>

      {chart && (
        <svg viewBox="0 0 280 72" preserveAspectRatio="none" className="mt-5 h-20 w-full" fill="none" role="img" aria-label="Gráfico da evolução do peso">
          <defs>
            <linearGradient id="peso-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={chart.area} fill="url(#peso-area)" />
          <path
            d={chart.line}
            pathLength={1}
            strokeDasharray="1"
            className="animate-draw"
            stroke="#059669"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={chart.last[0]} cy={chart.last[1]} r={3.5} fill="#059669" stroke="white" strokeWidth={1.5} />
        </svg>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {summary.deltaKg != null && summary.count > 1 && (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Desde a primeira</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{formatWeightDelta(summary.deltaKg)}</dd>
          </div>
        )}
        {summary.goalWeightKg != null && (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Meta</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{formatWeight(summary.goalWeightKg)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto pt-5">
        <Link href="/dashboard/patient/peso" className="text-sm font-semibold text-brand-700 hover:underline">
          Registrar e ver histórico
        </Link>
      </div>
    </section>
  );
}
