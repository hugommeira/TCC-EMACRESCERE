"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WeightPoint } from "@/services/api/weight";

export type ChartMetric = "weight" | "bmi";

interface WeightChartProps {
  points: WeightPoint[];
  metric: ChartMetric;
  /** Linha de referência tracejada (meta de peso). Ignorada no modo IMC. */
  goalKg?: number | null;
  height?: number;
}

const LINHA   = "#059669"; // brand-600
const AREA    = "#10b981"; // brand-500
const GRADE   = "#e6ecf4"; // ink-100
const TEXTO   = "#7a8ca4"; // ink-400
const TEXTO_F = "#172033"; // ink-800
const META    = "#7a8ca4";

const MARGEM = { top: 16, right: 16, bottom: 30, left: 44 };

/** Passo "redondo" do eixo (0,5 · 1 · 2 · 5 · 10...) pra não repetir rótulo. */
function passoBonito(bruto: number): number {
  const candidatos = [0.5, 1, 2, 5, 10, 20, 50, 100];
  for (const c of candidatos) if (bruto <= c) return c;
  return candidatos[candidatos.length - 1]!;
}

function formatarData(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatarDataLonga(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function WeightChart({ points, metric, goalKg, height = 260 }: WeightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(640);
  const [ativo, setAtivo]     = useState<number | null>(null);

  // O SVG é desenhado em pixels reais (não em viewBox escalado), senão os
  // rótulos encolhem junto com a largura e ficam ilegíveis no celular.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entrada]) => {
      if (entrada) setLargura(Math.max(260, entrada.contentRect.width));
    });
    ro.observe(el);
    setLargura(Math.max(260, el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const serie = useMemo(() => {
    return points
      .map((p) => ({
        ponto: p,
        valor: metric === "weight" ? p.weightKg : p.bmi?.value ?? null,
      }))
      .filter((d): d is { ponto: WeightPoint; valor: number } => d.valor != null);
  }, [points, metric]);

  const escala = useMemo(() => {
    if (serie.length === 0) return null;

    const valores = serie.map((d) => d.valor);
    const mostrarMeta = metric === "weight" && goalKg != null;
    if (mostrarMeta) valores.push(goalKg!);

    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const passo = passoBonito(Math.max(max - min, metric === "bmi" ? 1 : 2) / 4);
    const y0 = Math.floor(min / passo) * passo - passo;
    const y1 = Math.ceil(max / passo) * passo + passo;

    const larguraPlot = largura - MARGEM.left - MARGEM.right;
    const alturaPlot  = height - MARGEM.top - MARGEM.bottom;

    const x = (i: number) =>
      MARGEM.left + (serie.length === 1 ? larguraPlot / 2 : (i / (serie.length - 1)) * larguraPlot);
    const y = (v: number) =>
      MARGEM.top + alturaPlot - ((v - y0) / (y1 - y0)) * alturaPlot;

    const ticks: number[] = [];
    for (let v = y0; v <= y1 + 1e-9; v += passo) ticks.push(Math.round(v * 100) / 100);

    return { x, y, y0, y1, passo, ticks, larguraPlot, alturaPlot, casas: passo < 1 ? 1 : 0 };
  }, [serie, largura, height, metric, goalKg]);

  if (serie.length === 0 || !escala) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center rounded-xl border border-dashed border-ink-200 text-sm text-ink-400"
        style={{ height }}
      >
        {metric === "bmi"
          ? "Informe sua altura para ver a evolução do IMC."
          : "Nenhuma pesagem neste período."}
      </div>
    );
  }

  const { x, y, ticks, casas } = escala;
  const unidade = metric === "weight" ? " kg" : "";
  const titulo  = metric === "weight" ? "Evolução do peso" : "Evolução do IMC";

  const linha = serie.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.valor).toFixed(1)}`).join(" ");
  const area  =
    `${linha} L ${x(serie.length - 1).toFixed(1)} ${(MARGEM.top + escala.alturaPlot).toFixed(1)}` +
    ` L ${x(0).toFixed(1)} ${(MARGEM.top + escala.alturaPlot).toFixed(1)} Z`;

  // Quantos rótulos de data cabem sem colidir (~64px por rótulo).
  const passoRotulo = Math.max(1, Math.ceil(serie.length / Math.max(2, Math.floor(escala.larguraPlot / 64))));

  const destacado = ativo != null ? serie[ativo] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={largura}
        height={height}
        role="img"
        aria-label={`${titulo}. ${serie.length} ${serie.length === 1 ? "registro" : "registros"}, de ${serie[0]!.valor.toFixed(1)}${unidade} a ${serie[serie.length - 1]!.valor.toFixed(1)}${unidade}.`}
        onMouseLeave={() => setAtivo(null)}
      >
        {/* grade horizontal, recessiva */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={MARGEM.left} x2={largura - MARGEM.right} y1={y(t)} y2={y(t)} stroke={GRADE} strokeWidth={1} />
            <text x={MARGEM.left - 8} y={y(t) + 4} textAnchor="end" fontSize={12} fill={TEXTO}>
              {t.toFixed(casas).replace(".", ",")}
            </text>
          </g>
        ))}

        {/* meta: anotação, não uma segunda série */}
        {metric === "weight" && goalKg != null && goalKg >= escala.y0 && goalKg <= escala.y1 && (
          <g>
            <line
              x1={MARGEM.left} x2={largura - MARGEM.right} y1={y(goalKg)} y2={y(goalKg)}
              stroke={META} strokeWidth={1.5} strokeDasharray="5 4"
            />
            <text x={largura - MARGEM.right} y={y(goalKg) - 6} textAnchor="end" fontSize={11} fill={META}>
              meta {goalKg.toFixed(1).replace(".", ",")} kg
            </text>
          </g>
        )}

        <path d={area} fill={AREA} fillOpacity={0.1} />
        <path d={linha} fill="none" stroke={LINHA} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* rótulos do eixo x */}
        {serie.map((d, i) =>
          i % passoRotulo === 0 || i === serie.length - 1 ? (
            <text key={d.ponto.id} x={x(i)} y={height - 10} textAnchor="middle" fontSize={12} fill={TEXTO}>
              {formatarData(d.ponto.measuredAt)}
            </text>
          ) : null,
        )}

        {/* marcadores + alvos de toque maiores que o marcador */}
        {serie.map((d, i) => (
          <g key={d.ponto.id}>
            {ativo === i && (
              <line x1={x(i)} x2={x(i)} y1={MARGEM.top} y2={MARGEM.top + escala.alturaPlot} stroke={GRADE} strokeWidth={1.5} />
            )}
            <circle cx={x(i)} cy={y(d.valor)} r={ativo === i ? 6 : 4} fill="#ffffff" stroke={LINHA} strokeWidth={2} />
            <circle
              cx={x(i)} cy={y(d.valor)} r={16} fill="transparent"
              onMouseEnter={() => setAtivo(i)}
              onFocus={() => setAtivo(i)}
              tabIndex={0}
              role="button"
              aria-label={`${formatarDataLonga(d.ponto.measuredAt)}: ${d.valor.toFixed(1).replace(".", ",")}${unidade}`}
              style={{ outline: "none" }}
            />
          </g>
        ))}
      </svg>

      {destacado && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-ink-100 bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(x(ativo!) - 70, 0), Math.max(largura - 140, 0)),
            top:  Math.max(y(destacado.valor) - 62, 0),
            width: 140,
          }}
        >
          <p className="font-semibold" style={{ color: TEXTO_F }}>
            {destacado.valor.toFixed(1).replace(".", ",")}{unidade}
          </p>
          <p style={{ color: TEXTO }}>{formatarDataLonga(destacado.ponto.measuredAt)}</p>
          {metric === "weight" && destacado.ponto.bmi && (
            <p style={{ color: TEXTO }}>IMC {destacado.ponto.bmi.value.toFixed(1).replace(".", ",")}</p>
          )}
        </div>
      )}
    </div>
  );
}
