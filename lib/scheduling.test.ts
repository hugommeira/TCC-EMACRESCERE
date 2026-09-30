import { describe, it, expect } from "vitest";
import {
  DEFAULT_WEEK_HOURS,
  dayKeyOf,
  isOfferedSlot,
  isValidDateString,
  normalizeWeekHours,
  patientCancelIsRefundable,
  slotsForDate,
  toInstant,
  todayInSaoPaulo,
} from "@/lib/scheduling";

describe("isValidDateString", () => {
  it("aceita datas reais no formato AAAA-MM-DD", () => {
    expect(isValidDateString("2026-10-05")).toBe(true);
    expect(isValidDateString("2028-02-29")).toBe(true); // bissexto
  });

  it("recusa datas impossíveis e formatos errados", () => {
    expect(isValidDateString("2026-02-31")).toBe(false);
    expect(isValidDateString("2027-02-29")).toBe(false);
    expect(isValidDateString("05/10/2026")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });
});

describe("toInstant / dayKeyOf (fuso de São Paulo)", () => {
  it("converte horário local de SP para UTC (-03:00)", () => {
    expect(toInstant("2026-10-05", "09:00").toISOString()).toBe("2026-10-05T12:00:00.000Z");
    // 22h em SP já é o dia seguinte em UTC
    expect(toInstant("2026-10-05", "22:00").toISOString()).toBe("2026-10-06T01:00:00.000Z");
  });

  it("identifica o dia da semana da data local", () => {
    expect(dayKeyOf("2026-10-05")).toBe("mon");
    expect(dayKeyOf("2026-10-10")).toBe("sat");
    expect(dayKeyOf("2026-10-11")).toBe("sun");
  });

  it("todayInSaoPaulo não pula o dia à noite (servidor em UTC)", () => {
    // 23h de 05/10 em SP = 02h de 06/10 em UTC
    expect(todayInSaoPaulo(new Date("2026-10-06T02:00:00Z"))).toBe("2026-10-05");
  });
});

describe("normalizeWeekHours", () => {
  it("usa a agenda padrão quando o médico nunca configurou", () => {
    expect(normalizeWeekHours({})).toEqual(DEFAULT_WEEK_HOURS);
    expect(normalizeWeekHours(null)).toEqual(DEFAULT_WEEK_HOURS);
    expect(normalizeWeekHours("lixo")).toEqual(DEFAULT_WEEK_HOURS);
  });

  it("respeita dias fechados ([]) e descarta valores inválidos", () => {
    const h = normalizeWeekHours({ mon: ["09:00", "12:00"], tue: [], wed: ["25:00", "26:00"] });
    expect(h.mon).toEqual(["09:00", "12:00"]);
    expect(h.tue).toEqual([]);
    expect(h.wed).toBeUndefined();
  });
});

describe("slotsForDate", () => {
  const hours = normalizeWeekHours({ mon: ["08:00", "12:00"], fri: ["08:00", "17:00"], sat: [] });

  it("gera horários de hora em hora que terminam dentro do expediente", () => {
    expect(slotsForDate(hours, "2026-10-05")).toEqual(["08:00", "09:00", "10:00", "11:00"]);
  });

  it("não oferece nada em dia fechado ou não configurado", () => {
    expect(slotsForDate(hours, "2026-10-10")).toEqual([]); // sábado fechado
    expect(slotsForDate(hours, "2026-10-06")).toEqual([]); // terça não configurada
  });

  it("não oferece fim de semana na agenda padrão", () => {
    expect(slotsForDate(DEFAULT_WEEK_HOURS, "2026-10-10")).toEqual([]);
    expect(slotsForDate(DEFAULT_WEEK_HOURS, "2026-10-11")).toEqual([]);
  });
});

describe("isOfferedSlot", () => {
  const hours = normalizeWeekHours({ mon: ["08:00", "12:00"] });

  it("aceita um horário oferecido", () => {
    expect(isOfferedSlot(hours, toInstant("2026-10-05", "09:00"))).toBe(true);
  });

  it("recusa fora do expediente, fora da hora cheia ou em dia fechado", () => {
    expect(isOfferedSlot(hours, toInstant("2026-10-05", "12:00"))).toBe(false); // terminaria às 13h
    expect(isOfferedSlot(hours, toInstant("2026-10-05", "09:30"))).toBe(false);
    expect(isOfferedSlot(hours, toInstant("2026-10-06", "09:00"))).toBe(false); // terça
    expect(isOfferedSlot(hours, new Date("2026-10-05T12:00:30Z"))).toBe(false); // segundos
  });
});

describe("patientCancelIsRefundable (política de cancelamento)", () => {
  const consulta = new Date("2026-10-10T13:00:00Z");

  it("estorna com 24h ou mais de antecedência", () => {
    expect(patientCancelIsRefundable(consulta, new Date("2026-10-08T13:00:00Z"))).toBe(true);
    expect(patientCancelIsRefundable(consulta, new Date("2026-10-09T13:00:00Z"))).toBe(true); // exatamente 24h
  });

  it("não estorna com menos de 24h", () => {
    expect(patientCancelIsRefundable(consulta, new Date("2026-10-09T13:00:01Z"))).toBe(false);
    expect(patientCancelIsRefundable(consulta, new Date("2026-10-10T12:00:00Z"))).toBe(false);
  });
});
