import type { Metadata }  from "next";
import { auth }           from "@/lib/auth";
import { redirect }       from "next/navigation";
import { prisma }         from "@/lib/prisma";
import {
  DashboardShell,
  PageHeader,
  StatCard,
  SectionCard,
} from "@/components/layout/DashboardShell";
import { formatCurrency } from "@/lib/utils";
import Link               from "next/link";

export const metadata: Metadata = { title: "Admin – Visão geral" };

const ICONS = {
  users: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  doctor: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v6a4 4 0 0 0 8 0V3M9 13v3a4 4 0 0 0 8 0v-3M17 13a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
    </svg>
  ),
  patient: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  consultation: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18M9 16h6" />
    </svg>
  ),
  today: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  live: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
};

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: "bg-emerald-50  text-emerald-700  ring-emerald-200",
  COMPLETED:   "bg-slate-100   text-slate-700   ring-slate-200",
  CANCELLED:   "bg-rose-50     text-rose-700    ring-rose-200",
  WAITING:     "bg-amber-50    text-amber-700   ring-amber-200",
  SCHEDULED:   "bg-brand-50    text-brand-700   ring-brand-200",
};

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "Em andamento",
  COMPLETED:   "Concluída",
  CANCELLED:   "Cancelada",
  WAITING:     "Aguardando",
  SCHEDULED:   "Agendada",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/auth/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalDoctors,
    totalPatients,
    totalConsultations,
    todayConsultations,
    activeConsultations,
    revenueAgg,
    pendingPayments,
    recentConsultations,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { role: "DOCTOR",  active: true } }),
    prisma.user.count({ where: { role: "PATIENT", active: true } }),
    prisma.consultation.count(),
    prisma.consultation.count({ where: { scheduledAt: { gte: today } } }),
    prisma.consultation.count({ where: { status: { in: ["IN_PROGRESS", "WAITING"] } } }),
    prisma.payment.aggregate({ where: { status: "RECEIVED" }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.consultation.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { patient: true, doctor: true, payment: true },
    }),
  ]);

  return (
    <DashboardShell>
      <PageHeader
        badge="Em tempo real"
        title="Visão geral"
        description="Métricas, usuários e operação da plataforma"
        action={
          <>
            <Link
              href="/dashboard/admin/doctors"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Cadastrar médico
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg"
            >
              Gerenciar usuários
            </Link>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuários totais" value={String(totalUsers)}    tone="brand"  icon={ICONS.users}        href="/dashboard/admin/users" />
        <StatCard label="Médicos ativos"  value={String(totalDoctors)}  tone="teal"   icon={ICONS.doctor}       href="/dashboard/admin/doctors" />
        <StatCard label="Pacientes"       value={String(totalPatients)} tone="indigo" icon={ICONS.patient}      href="/dashboard/admin/users" />
        <StatCard label="Consultas"       value={String(totalConsultations)} tone="slate" icon={ICONS.consultation} href="/dashboard/admin/consultations" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hoje"            value={String(todayConsultations)}  tone="amber" icon={ICONS.today} href="/dashboard/admin/consultations" />
        <StatCard label="Ao vivo"         value={String(activeConsultations)} tone="teal"  icon={ICONS.live}  href="/dashboard/admin/consultations" />
        <StatCard label="Receita"         value={formatCurrency(Number(revenueAgg._sum.amount ?? 0))} tone="brand" icon={ICONS.cash} href="/dashboard/admin/payments" />
        <StatCard label="Pgtos. pendentes" value={String(pendingPayments)}    tone="rose"  icon={ICONS.alert} href="/dashboard/admin/payments" />
      </div>

      {/* Recent consultations */}
      <SectionCard
        className="mt-10 overflow-hidden"
        title="Consultas recentes"
        description="As últimas 10 consultas registradas"
        action={
          <Link
            href="/dashboard/admin/consultations"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Ver todas →
          </Link>
        }
      >
        <div className="-mx-5 -mb-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Paciente", "Médico", "Status", "Data"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentConsultations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">
                    Nenhuma consulta registrada ainda.
                  </td>
                </tr>
              )}
              {recentConsultations.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{c.patient.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{c.doctor ? `Dr(a). ${c.doctor.name}` : "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                        STATUS_STYLES[c.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit", month: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    }).format(c.scheduledAt ?? c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
