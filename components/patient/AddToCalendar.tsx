import { googleCalendarUrl, consultationEvent, CALENDAR_REMINDERS_MIN } from "@/lib/calendar";
import { SLOT_MINUTES } from "@/lib/scheduling";

/**
 * "Salvar na agenda" de uma consulta marcada: Google Agenda (abre o evento
 * preenchido) ou arquivo .ics (iPhone, Outlook, Android), que já leva os
 * lembretes. Só links: nada é salvo sem o paciente confirmar na agenda dele.
 */
export function AddToCalendar({
  consultationId, scheduledAt, doctorLabel, baseUrl,
}: {
  consultationId: string;
  scheduledAt:    Date;
  doctorLabel:    string;
  baseUrl?:       string | undefined;
}) {
  const google = googleCalendarUrl(consultationEvent({
    id: consultationId, scheduledAt, doctorLabel, durationMin: SLOT_MINUTES, baseUrl,
  }));
  const lembretes = CALENDAR_REMINDERS_MIN
    .map((m) => (m >= 60 * 24 ? `${m / (60 * 24)} dia` : `${m} min`))
    .join(" e ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Salvar na sua agenda</p>
      <p className="mt-0.5 text-xs text-slate-500">Para não esquecer o dia e a hora da consulta.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={google}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <CalendarIcon />
          Google Agenda
        </a>
        <a
          href={`/api/consultations/${consultationId}/calendar`}
          download
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <CalendarIcon />
          iPhone, Outlook e outros
        </a>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        O arquivo da agenda já vem com lembretes ({lembretes} antes). No Google Agenda valem os lembretes padrão da sua conta.
      </p>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M12 14v4M10 16h4" />
    </svg>
  );
}
