import type { Metadata }  from "next";
import { auth }           from "@/lib/auth";
import { redirect }       from "next/navigation";
import { listDoctorConsultations } from "@/services/api/consultation";
import {
  DashboardShell, PageHeader, EmptyState, SectionCard,
} from "@/components/layout/DashboardShell";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { Pagination }     from "@/components/history/Pagination";
import { DoctorConsultationActions } from "@/components/doctor/DoctorConsultationsActions";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import type { ConsultationStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Consultas" };
export const dynamic  = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED:    "Agendada",
  WAITING:      "Na fila",
  IN_PROGRESS:  "Em andamento",
  COMPLETED:    "Concluída",
  CANCELLED:    "Cancelada",
  NO_SHOW:      "Não compareceu",
};

const STATUS_RING: Record<string, string> = {
  SCHEDULED:    "bg-slate-100 text-slate-700 ring-slate-200",
  WAITING:      "bg-amber-50 text-amber-700 ring-amber-200",
  IN_PROGRESS:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  COMPLETED:    "bg-brand-50 text-brand-700 ring-brand-200",
  CANCELLED:    "bg-rose-50 text-rose-700 ring-rose-200",
  NO_SHOW:      "bg-rose-50 text-rose-700 ring-rose-200",
};

function isStatus(v: string): v is ConsultationStatus {
  return ["SCHEDULED","WAITING","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"].includes(v);
}

export default async function DoctorConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/auth/login");

  const sp     = await searchParams;
  const page   = Number(sp.page ?? 1) || 1;
  const status = sp.status && isStatus(sp.status) ? sp.status : undefined;
  const q      = sp.q?.trim() || undefined;

  const { data: items, pages, total } = await listDoctorConsultations(
    session.user.id,
    {
      page,
      limit: 10,
      ...(status ? { status } : {}),
      ...(q      ? { q }      : {}),
    },
  );

  return (
    <DashboardShell>
      <PageHeader
        badge="Histórico"
        title="Suas consultas"
        description={`${total} ${total === 1 ? "atendimento" : "atendimentos"} no total`}
        action={
          <Link
            href="/dashboard/doctor/queue"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md"
          >
            Ir para fila
          </Link>
        }
      />

      <div className="mb-4">
        <HistoryFilters />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>
          }
          title="Nenhuma consulta encontrada"
          description={q || status ? "Ajuste os filtros ou aguarde pacientes na fila." : "Você ainda não tem histórico de atendimentos."}
        />
      ) : (
        <SectionCard title="Atendimentos" className="overflow-hidden">
          <div className="-mx-5 -mt-5 -mb-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Data</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Paciente</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Queixa</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Receita</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/40">
                    <td className="px-5 py-3.5 text-slate-700">
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      }).format(c.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {c.patient.name}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3.5 text-slate-600">
                      {c.chiefComplaint ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {c.payment ? formatCurrency(Number(c.payment.amount)) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STATUS_RING[c.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <DoctorConsultationActions
                        consultationId={c.id}
                        status={c.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <div className="mt-6">
        <Pagination page={page} pages={pages} />
      </div>
    </DashboardShell>
  );
}
