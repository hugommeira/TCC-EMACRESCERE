import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatPhone,
  maskCpf,
  isValidCpf,
} from "@/lib/utils";

describe("cn", () => {
  it("junta classes truthy com espaço", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
  });
});

describe("formatCurrency", () => {
  it("formata número em BRL", () => {
    expect(formatCurrency(150)).toBe("R$ 150,00");
  });

  it("aceita string numérica", () => {
    expect(formatCurrency("99.9")).toBe("R$ 99,90");
  });
});

describe("formatDate", () => {
  it("formata data no padrão brasileiro dd/mm/aaaa", () => {
    expect(formatDate(new Date("2026-08-31T12:00:00Z"))).toBe("31/08/2026");
  });
});

describe("formatPhone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(formatPhone("11999999999")).toBe("(11) 99999-9999");
  });

  it("formata fixo com 10 dígitos", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });
});

describe("maskCpf", () => {
  it("aplica máscara 000.000.000-00", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
  });
});

describe("isValidCpf", () => {
  it("aceita CPF válido (com máscara)", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("aceita CPF válido (só dígitos)", () => {
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejeita CPF com dígito verificador errado", () => {
    expect(isValidCpf("52998224700")).toBe(false);
  });

  it("rejeita sequência de dígitos repetidos", () => {
    expect(isValidCpf("11111111111")).toBe(false);
  });

  it("rejeita tamanho inválido", () => {
    expect(isValidCpf("123")).toBe(false);
  });
});
