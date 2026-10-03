// ─── IMC (Índice de Massa Corporal) ───────────────────────────────────────────
//
// Fonte única do cálculo. O app Flutter tem a mesma lógica em
// lib/models/weight_entry.dart (classifyBmi/calculateBmi) — se mudar aqui,
// mude lá, senão site e app mostram categorias diferentes pro mesmo peso.
//
// O IMC não é gravado no banco: é derivado de WeightRecord.weightKg e de
// PatientProfile.heightCm toda vez que se lê. Assim, corrigir uma altura
// digitada errada conserta o histórico inteiro de uma vez.

/**
 * Arredonda para uma casa decimal de forma previsível.
 *
 * `(72.35).toFixed(1)` devolve "72.3": 72,35 não é exato em binário, é
 * 72,34999... O épsilon relativo empurra esses casos para o meio-acima, que
 * é o que qualquer pessoa espera ver na balança.
 */
function umaCasa(v: number): number {
  return Math.round((v + Number.EPSILON * Math.abs(v)) * 10) / 10;
}

/** Faixas da OMS para adultos. */
export const BMI_CATEGORIES = [
  { key: "UNDERWEIGHT",  label: "Abaixo do peso",    max: 18.5 },
  { key: "NORMAL",       label: "Peso normal",       max: 25   },
  { key: "OVERWEIGHT",   label: "Sobrepeso",         max: 30   },
  { key: "OBESE_1",      label: "Obesidade grau I",  max: 35   },
  { key: "OBESE_2",      label: "Obesidade grau II", max: 40   },
  { key: "OBESE_3",      label: "Obesidade grau III", max: Infinity },
] as const;

export type BmiCategoryKey = (typeof BMI_CATEGORIES)[number]["key"];

export interface BmiResult {
  value:    number;         // arredondado a 1 casa
  category: BmiCategoryKey;
  label:    string;
}

/** Limites aceitos nos formulários — evita digitação absurda virar dado. */
export const WEIGHT_MIN_KG  = 20;
export const WEIGHT_MAX_KG  = 400;
export const HEIGHT_MIN_CM  = 100;
export const HEIGHT_MAX_CM  = 250;

/**
 * IMC = peso (kg) / altura (m)². Devolve null quando falta a altura — é o
 * caso de todo paciente que ainda não preencheu o perfil.
 */
export function calculateBmi(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): BmiResult | null {
  if (weightKg == null || heightCm == null) return null;
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) return null;
  if (weightKg <= 0 || heightCm <= 0) return null;

  const heightM = heightCm / 100;
  const raw     = weightKg / (heightM * heightM);
  const value   = umaCasa(raw);

  return { value, ...classifyBmi(value) };
}

/** Classificação da OMS a partir de um IMC já calculado. */
export function classifyBmi(bmi: number): { category: BmiCategoryKey; label: string } {
  for (const faixa of BMI_CATEGORIES) {
    if (bmi < faixa.max) return { category: faixa.key, label: faixa.label };
  }
  // Inalcançável (a última faixa é Infinity), mas o TS não sabe disso.
  const ultima = BMI_CATEGORIES[BMI_CATEGORIES.length - 1]!;
  return { category: ultima.key, label: ultima.label };
}

/**
 * Peso que colocaria o paciente no topo da faixa "peso normal" (IMC 24,9),
 * usado como sugestão de meta. Null sem altura.
 */
export function healthyWeightCeilingKg(heightCm: number | null | undefined): number | null {
  if (heightCm == null || !Number.isFinite(heightCm) || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return umaCasa(24.9 * heightM * heightM);
}

/** "72,4 kg" — vírgula decimal, como o resto do sistema. */
export function formatWeight(kg: number): string {
  return `${umaCasa(kg).toFixed(1).replace(".", ",")} kg`;
}

/** "+1,2 kg" / "−3,0 kg" / "0,0 kg" — com sinal explícito. */
export function formatWeightDelta(deltaKg: number): string {
  const sinal = deltaKg > 0 ? "+" : deltaKg < 0 ? "−" : "";
  return `${sinal}${umaCasa(Math.abs(deltaKg)).toFixed(1).replace(".", ",")} kg`;
}
