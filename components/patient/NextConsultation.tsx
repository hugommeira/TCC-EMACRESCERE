import Link from "next/link";
import type { Route } from "next";
import type { ConsultationStatus, PaymentStatus } from "@prisma/client";
import { Avatar } from "@/components/ui/Avatar";
import { doctorTitle } from "@/lib/utils";
import { PATIENT_NEW_CONSULTATION_HREF, QUEUE_ENABLED } from "@/lib/constants";

// Destaque do início do paciente: a consulta que importa agora e o próximo
// passo dela (pagar, entrar, ver). Lógica de estados adaptada da prévia do
// painel na branch redesign-frontend, sobre os componentes atuais.

export interface NextConsultationData {
  id:            string;
  status:        ConsultationStatus;
  scheduledAt:   Date | null;
  doctor:        { name: string; avatarUrl: string | null; specialty: string | null } | null;
  paymentStatus: PaymentStatus | null;
}

const TZ = "America/Sao_Paulo";
const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: TZ });
const dayFmt     = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: TZ });
const timeFmt    = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const ymdFmt     = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

/** "hoje", "amanhã", "em 12 dias", contado em dias de calendário de São Paulo. */
function relativeDay(at: Date, now = new Date()): string {
  const days = Math.round((Date.parse(ymdFmt.format(at)) - Date.parse(ymdFmt.format(now))) / 86_400_000);
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days > 1)   return `em ${days} dias`;
  return "horário já passou";
}

const isPaid = (s: PaymentStatus | null) => s === "CONFIRMED" || s === "RECEIVED";

const STATUS = {
  IN_PROGRESS: { label: "Em andamento",       className: "bg-brand-500 text-white" },
  WAITING:     { label: "Na fila",            className: "bg-teal-50 text-teal-700 ring-1 ring-teal-200" },
  PAID:        { label: "Confirmada",         className: "bg-brand-50 text-brand-700 ring-1 ring-brand-200" },
  UNPAID:      { label: "Aguardando pagamento", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
} as const;

const CTA_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30";
const CTA_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200";

export function NextConsultation({ c }: { c: NextConsultationData | null }) {
  if (!c) {
    return (
      <section
        aria-labelledby="proxima-consulta"
        className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-teal-50/60 p-6 ring-1 ring-slate-200 sm:p-7"
      >
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="relative">
          <h2 id="proxima-consulta" className="text-sm font-semibold text-brand-700">Próxima consulta</h2>
          <p className="mt-3 font-display text-2xl font-semibold text-slate-900">Nenhuma consulta marcada</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            {QUEUE_ENABLED
              ? "Entre na fila e seja atendido pelo próximo médico disponível, ou marque um horário."
              : "Escolha um médico e um horário livre na agenda dele. Você paga ao agendar."}
          </p>
        </div>
        <Link href={PATIENT_NEW_CONSULTATION_HREF} className={`${CTA_PRIMARY} relative mt-6 self-start`}>
          {QUEUE_ENABLED ? "Atendimento agora" : "Agendar consulta"}
        </Link>
      </section>
    );
  }

  const paid   = isPaid(c.paymentStatus);
  const status =
    c.status === "IN_PROGRESS" ? STATUS.IN_PROGRESS :
    c.status === "WAITING"     ? STATUS.WAITING :
    paid                       ? STATUS.PAID : STATUS.UNPAID;
  const doctor = c.doctor ? doctorTitle(c.doctor.name) : "Médico a definir";
  const page   = `/dashboard/patient/queue/${c.id}` as Route;

  const action =
    c.status === "IN_PROGRESS" ? { label: "Entrar na sala", href: `/consulta/${c.id}` as Route, primary: true } :
    c.status === "WAITING"     ? { label: "Acompanhar fila", href: page, primary: true } :
    !paid                      ? { label: "Pagar consulta", href: page, primary: true } :
                                 { label: "Ver detalhes",    href: page, primary: false };

  return (
    <section
      aria-labelledby="proxima-consulta"
      className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-teal-500" />

      <div className="flex items-start justify-between gap-3">
        <h2 id="proxima-consulta" className="text-sm font-semibold text-brand-700">Próxima consulta</h2>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
          {c.status === "IN_PROGRESS" && (
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          )}
          {status.label}
        </span>
      </div>

      {c.scheduledAt ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500 first-letter:uppercase">
            {weekdayFmt.format(c.scheduledAt)}, {relativeDay(c.scheduledAt)}
          </p>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-3xl font-semibold tracking-tight text-slate-900">{dayFmt.format(c.scheduledAt)}</span>
            <span className="font-display text-3xl font-semibold tabular-nums text-brand-600">{timeFmt.format(c.scheduledAt)}</span>
          </p>
        </div>
      ) : (
        <p className="mt-4 font-display text-2xl font-semibold text-slate-900">Atendimento pela fila</p>
      )}

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
        <Avatar name={c.doctor?.name ?? "Médico"} src={c.doctor?.avatarUrl ?? null} size="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{doctor}</p>
          <p className="truncate text-sm text-slate-500">{c.doctor?.specialty ?? "Atendimento por vídeo"}</p>
        </div>
      </div>

      {!paid && c.status === "SCHEDULED" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          O horário só fica garantido depois que o pagamento é confirmado.
        </p>
      )}
      {paid && c.status === "SCHEDULED" && (
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          No horário, o médico chama você por aqui. O aviso chega no sino de notificações.
        </p>
      )}

      <div className="mt-auto pt-6">
        <Link href={action.href} className={action.primary ? CTA_PRIMARY : CTA_SECONDARY}>
          {action.label}
        </Link>
      </div>
    </section>
  );
}
