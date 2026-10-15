"use client";

// Linha simples de uma medida ao longo do tempo (SVG em viewBox fixo, escala
// com a largura). Separada do WeightChart para não mexer em peso/IMC.

const LINHA = "#059669";
const GRADE = "#e6ecf4";
const TEXTO = "#7a8ca4";

const W = 600, H = 180;
const M = { top: 14, right: 14, bottom: 26, left: 40 };

export function MeasureChart({
  points, unit,
}: {
  points: { measuredAt: string; value: number }[];
  unit: string;
}) {
  if (points.length < 2) {
    return (
      <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
        O gráfico aparece a partir de duas medidas.
      </p>
    );
  }

  const xs = points.map((p) => new Date(p.measuredAt).getTime());
  const ys = points.map((p) => p.value);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  let yMin = Math.min(...ys), yMax = Math.max(...ys);
  const folga = Math.max((yMax - yMin) * 0.15, 1);
  yMin -= folga; yMax += folga;

  const px = (x: number) => M.left + ((x - xMin) / Math.max(xMax - xMin, 1)) * (W - M.left - M.right);
  const py = (y: number) => M.top + (1 - (y - yMin) / (yMax - yMin)) * (H - M.top - M.bottom);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${px(xs[i] ?? 0).toFixed(1)},${py(p.value).toFixed(1)}`).join(" ");

  const ticks = [yMin, (yMin + yMax) / 2, yMax];
  const fmtData = (t: number) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).format(t);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Evolução em ${unit}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.left} x2={W - M.right} y1={py(t)} y2={py(t)} stroke={GRADE} />
          <text x={M.left - 6} y={py(t) + 4} textAnchor="end" fontSize="11" fill={TEXTO}>
            {t.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          </text>
        </g>
      ))}
      <text x={M.left} y={H - 6} fontSize="11" fill={TEXTO}>{fmtData(xMin)}</text>
      <text x={W - M.right} y={H - 6} textAnchor="end" fontSize="11" fill={TEXTO}>{fmtData(xMax)}</text>
      <path d={d} fill="none" stroke={LINHA} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.measuredAt + i} cx={px(xs[i] ?? 0)} cy={py(p.value)} r={3.5} fill={LINHA}>
          <title>{`${fmtData(xs[i] ?? 0)}: ${p.value.toLocaleString("pt-BR")} ${unit}`}</title>
        </circle>
      ))}
    </svg>
  );
}
