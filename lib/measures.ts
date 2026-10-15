// Registro das medidas do corpo além do peso (tabela BodyMeasurement).
// Para acrescentar uma medida: uma entrada aqui + ajuste de tela. Sem fórmulas
// de estimativa (IAC, Deurenberg, CUN-BAE): só valores medidos ou de exame.
//
// Arquivo sem import de servidor: usado também no navegador.

export const MEASURE_TYPES = ["waist", "hip", "body_fat", "lean_mass"] as const;
export type MeasureType = (typeof MEASURE_TYPES)[number];

export interface MeasureDef {
  label:    string;
  unit:     string;
  min:      number;
  max:      number;
  decimals: number;
  /** Como medir (aparece no formulário). */
  hint:     string;
}

export const MEASURES: Record<MeasureType, MeasureDef> = {
  waist: {
    label: "Cintura", unit: "cm", min: 40, max: 250, decimals: 1,
    hint:  "Fita na altura do umbigo, sem apertar, ao fim de uma expiração normal.",
  },
  hip: {
    label: "Quadril", unit: "cm", min: 50, max: 250, decimals: 1,
    hint:  "Fita na parte mais larga do quadril, em pé e com os pés juntos.",
  },
  body_fat: {
    label: "Gordura corporal", unit: "%", min: 3, max: 75, decimals: 1,
    hint:  "Valor da bioimpedância ou da avaliação feita pelo seu médico.",
  },
  lean_mass: {
    label: "Massa magra", unit: "kg", min: 10, max: 200, decimals: 1,
    hint:  "Valor da bioimpedância ou da avaliação feita pelo seu médico.",
  },
};

export function isMeasureType(t: unknown): t is MeasureType {
  return typeof t === "string" && (MEASURE_TYPES as readonly string[]).includes(t);
}

const duasCasas = (n: number) => Math.round(n * 100) / 100;

/** Relação cintura/estatura (RCEst). Null sem cintura ou sem altura. */
export function waistToHeight(waistCm: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!waistCm || !heightCm || waistCm <= 0 || heightCm <= 0) return null;
  return duasCasas(waistCm / heightCm);
}

/** Relação cintura/quadril (RCQ). Null sem uma das duas medidas. */
export function waistToHip(waistCm: number | null | undefined, hipCm: number | null | undefined): number | null {
  if (!waistCm || !hipCm || waistCm <= 0 || hipCm <= 0) return null;
  return duasCasas(waistCm / hipCm);
}

export function formatMeasure(type: MeasureType, value: number): string {
  const d = MEASURES[type];
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: d.decimals })} ${d.unit}`;
}
