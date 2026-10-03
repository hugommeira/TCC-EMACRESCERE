import { describe, it, expect } from "vitest";
import {
  calculateBmi,
  classifyBmi,
  healthyWeightCeilingKg,
  formatWeight,
  formatWeightDelta,
} from "@/lib/bmi";

describe("calculateBmi", () => {
  it("calcula peso / altura² e arredonda a uma casa", () => {
    // 70 / 1,75² = 22,857...
    expect(calculateBmi(70, 175)?.value).toBe(22.9);
  });

  it("confere com os pacientes de demonstração do seed", () => {
    // mariana.castro: 88,2 kg, 165 cm -> o seed registra IMC 32,4
    expect(calculateBmi(88.2, 165)?.value).toBe(32.4);
    // rafael.osantos: 104,5 kg, 178 cm -> 33,0
    expect(calculateBmi(104.5, 178)?.value).toBe(33.0);
  });

  it("devolve null sem altura", () => {
    expect(calculateBmi(80, null)).toBeNull();
    expect(calculateBmi(80, undefined)).toBeNull();
  });

  it("devolve null com entrada inválida", () => {
    expect(calculateBmi(0, 170)).toBeNull();
    expect(calculateBmi(-5, 170)).toBeNull();
    expect(calculateBmi(70, 0)).toBeNull();
    expect(calculateBmi(Number.NaN, 170)).toBeNull();
  });

  it("vem com categoria e rótulo junto", () => {
    const r = calculateBmi(95, 170);
    expect(r?.category).toBe("OBESE_1");
    expect(r?.label).toBe("Obesidade grau I");
  });
});

describe("classifyBmi", () => {
  it("usa as faixas da OMS", () => {
    expect(classifyBmi(17).category).toBe("UNDERWEIGHT");
    expect(classifyBmi(22).category).toBe("NORMAL");
    expect(classifyBmi(27).category).toBe("OVERWEIGHT");
    expect(classifyBmi(32).category).toBe("OBESE_1");
    expect(classifyBmi(37).category).toBe("OBESE_2");
    expect(classifyBmi(45).category).toBe("OBESE_3");
  });

  it("trata os limites como início da faixa seguinte", () => {
    expect(classifyBmi(18.4).category).toBe("UNDERWEIGHT");
    expect(classifyBmi(18.5).category).toBe("NORMAL");
    expect(classifyBmi(24.9).category).toBe("NORMAL");
    expect(classifyBmi(25).category).toBe("OVERWEIGHT");
    expect(classifyBmi(29.9).category).toBe("OVERWEIGHT");
    expect(classifyBmi(30).category).toBe("OBESE_1");
  });
});

describe("healthyWeightCeilingKg", () => {
  it("devolve o peso de IMC 24,9 para a altura", () => {
    // 24,9 × 1,70² = 71,96 -> 72,0
    expect(healthyWeightCeilingKg(170)).toBe(72);
  });

  it("devolve null sem altura", () => {
    expect(healthyWeightCeilingKg(null)).toBeNull();
    expect(healthyWeightCeilingKg(0)).toBeNull();
  });
});

describe("formatação", () => {
  it("escreve o peso com vírgula decimal", () => {
    expect(formatWeight(72.35)).toBe("72,4 kg");
    expect(formatWeight(80)).toBe("80,0 kg");
  });

  it("escreve a variação com sinal", () => {
    expect(formatWeightDelta(1.2)).toBe("+1,2 kg");
    expect(formatWeightDelta(-3)).toBe("−3,0 kg");
    expect(formatWeightDelta(0)).toBe("0,0 kg");
  });
});
