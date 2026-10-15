import { describe, expect, it } from "vitest";
import { MEASURES, MEASURE_TYPES, isMeasureType, waistToHeight, waistToHip } from "./measures";
import { createMeasureSchema } from "./validations/measures";

describe("registro de medidas", () => {
  it("todo tipo tem rótulo, unidade e limites coerentes", () => {
    for (const t of MEASURE_TYPES) {
      const d = MEASURES[t];
      expect(d.label).toBeTruthy();
      expect(d.unit).toBeTruthy();
      expect(d.min).toBeLessThan(d.max);
    }
    expect(isMeasureType("waist")).toBe(true);
    expect(isMeasureType("iac")).toBe(false);
  });

  it("RCEst = cintura ÷ altura, com duas casas; sem altura, null", () => {
    expect(waistToHeight(88, 165)).toBe(0.53);
    expect(waistToHeight(88, null)).toBeNull();
    expect(waistToHeight(null, 165)).toBeNull();
  });

  it("RCQ = cintura ÷ quadril; sem quadril, null", () => {
    expect(waistToHip(88, 104)).toBe(0.85);
    expect(waistToHip(88, undefined)).toBeNull();
  });
});

describe("createMeasureSchema", () => {
  it("aceita valor dentro do limite da medida", () => {
    expect(createMeasureSchema.parse({ type: "waist", value: "88,5".replace(",", ".") }))
      .toMatchObject({ type: "waist", value: 88.5 });
  });

  it("recusa valor fora do limite, tipo desconhecido e data no futuro", () => {
    expect(createMeasureSchema.safeParse({ type: "body_fat", value: 90 }).success).toBe(false);
    expect(createMeasureSchema.safeParse({ type: "iac", value: 30 }).success).toBe(false);
    expect(createMeasureSchema.safeParse({ type: "hip", value: 100, measuredAt: "2999-01-01" }).success).toBe(false);
  });
});
