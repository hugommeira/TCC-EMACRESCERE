import { describe, it, expect } from "vitest";
import { safeCallbackUrl } from "./redirect";

describe("safeCallbackUrl", () => {
  it("aceita caminho interno, com query", () => {
    expect(safeCallbackUrl("/dashboard/patient/schedule?doctor=a&date=2026-10-05&time=12:00"))
      .toBe("/dashboard/patient/schedule?doctor=a&date=2026-10-05&time=12:00");
  });
  it("recusa destino externo", () => {
    expect(safeCallbackUrl("https://evil.example")).toBe("/");
    expect(safeCallbackUrl("//evil.example")).toBe("/");
    expect(safeCallbackUrl("/\\evil.example")).toBe("/");
  });
  it("usa o padrão quando vazio", () => {
    expect(safeCallbackUrl(null)).toBe("/");
    expect(safeCallbackUrl("", "/x")).toBe("/x");
  });
});
