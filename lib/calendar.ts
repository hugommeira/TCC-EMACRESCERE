// "Adicionar à agenda" de uma consulta marcada: link do Google Agenda e
// arquivo .ics (iPhone, Outlook, Android e qualquer agenda que aceite o
// padrão iCalendar, RFC 5545). Funções puras, sem integração com conta:
// o paciente decide salvar. Lembretes só no .ics (o link do Google usa os
// lembretes padrão da agenda da pessoa).

export interface CalendarEvent {
  /** Identificador estável (o id da consulta): reimportar atualiza o mesmo evento. */
  uid:         string;
  title:       string;
  start:       Date;
  end:         Date;
  description: string;
  /** Endereço da sala/consulta na plataforma. */
  url:         string;
}

/** Lembretes do .ics, em minutos antes do início (1 dia e 30 min). */
export const CALENDAR_REMINDERS_MIN = [24 * 60, 30];

/** 20261020T130000Z (UTC, formato do iCalendar e do Google). */
function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    action:   "TEMPLATE",
    text:     e.title,
    dates:    `${utcStamp(e.start)}/${utcStamp(e.end)}`,
    details:  `${e.description}\n\n${e.url}`,
    location: e.url,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** Escapa texto do iCalendar (\, ; , e quebra de linha). */
function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Dobra linhas longas (máx. 75 octetos por linha, continuação com espaço). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let atual = "";
  let tam = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    const limite = out.length === 0 ? 75 : 74; // a continuação começa com espaço
    if (tam + n > limite) {
      out.push(atual);
      atual = "";
      tam = 0;
    }
    atual += ch;
    tam += n;
  }
  out.push(atual);
  return out.join("\r\n ");
}

export function buildIcs(e: CalendarEvent, now: Date = new Date()): string {
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Emacrescere//Consultas//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@emacrescere`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(e.start)}`,
    `DTEND:${utcStamp(e.end)}`,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(`${e.description}\n\n${e.url}`)}`,
    `LOCATION:${icsText(e.url)}`,
    `URL:${e.url}`,
    "STATUS:CONFIRMED",
    ...CALENDAR_REMINDERS_MIN.flatMap((min) => [
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsText(e.title)}`,
      `TRIGGER:-PT${min}M`,
      "END:VALARM",
    ]),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return linhas.map(fold).join("\r\n") + "\r\n";
}

/** Evento de uma consulta marcada (duração de um horário da agenda). */
export function consultationEvent(c: {
  id:          string;
  scheduledAt: Date;
  doctorLabel: string;
  durationMin: number;
  /** Endereço do site; sem ele o link fica relativo (só para exibição). */
  baseUrl?:    string | undefined;
}): CalendarEvent {
  return {
    uid:         c.id,
    title:       `Consulta Emacrescere com ${c.doctorLabel}`,
    start:       c.scheduledAt,
    end:         new Date(c.scheduledAt.getTime() + c.durationMin * 60_000),
    description: "Teleconsulta por vídeo na Emacrescere. Perto do horário, entre pelo link para o médico te chamar.",
    url:         `${c.baseUrl ?? ""}/dashboard/patient/queue/${c.id}`,
  };
}
