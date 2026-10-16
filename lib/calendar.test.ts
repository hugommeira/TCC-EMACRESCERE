import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl, type CalendarEvent } from "./calendar";

const ev: CalendarEvent = {
  uid:         "cmconsulta123",
  title:       "Consulta com Dra. Fernanda Costa",
  start:       new Date("2026-10-20T13:00:00.000Z"), // 10:00 em Brasília
  end:         new Date("2026-10-20T14:00:00.000Z"),
  description: "Teleconsulta pela Emacrescere; entre pelo link, perto do horário.",
  url:         "https://tcc-emacrescere.vercel.app/dashboard/patient/queue/cmconsulta123",
};

describe("googleCalendarUrl", () => {
  it("monta o modelo do Google com título e horário em UTC", () => {
    const u = new URL(googleCalendarUrl(ev));
    expect(u.origin).toBe("https://calendar.google.com");
    expect(u.searchParams.get("action")).toBe("TEMPLATE");
    expect(u.searchParams.get("text")).toBe(ev.title);
    expect(u.searchParams.get("dates")).toBe("20261020T130000Z/20261020T140000Z");
    expect(u.searchParams.get("details")).toContain(ev.url);
  });
});

describe("buildIcs", () => {
  const ics = buildIcs(ev, new Date("2026-10-16T12:00:00.000Z"));

  it("evento com início, fim, uid estável e dois lembretes", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20261020T130000Z");
    expect(ics).toContain("DTEND:20261020T140000Z");
    expect(ics).toContain("UID:cmconsulta123@emacrescere");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
    expect(ics).toContain("TRIGGER:-PT1440M");
    expect(ics).toContain("TRIGGER:-PT30M");
  });

  it("usa CRLF, escapa vírgula/ponto e vírgula e dobra linhas longas (≤ 75 octetos)", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics).toContain("Emacrescere\\;");
    for (const linha of ics.split("\r\n")) {
      expect(new TextEncoder().encode(linha).length).toBeLessThanOrEqual(75);
    }
  });
});
