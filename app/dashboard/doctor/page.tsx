import type { Metadata }  from "next";
import { auth }           from "@/lib/auth";
import { redirect }       from "next/navigation";
import { prisma }         from "@/lib/prisma";
import {
  DashboardShell,
  PageHeader,
  StatCard,
  EmptyState,
} from "@/components/layout/DashboardShell";
import { ConsultationCard } from "@/components/patient/ConsultationCard";
import { formatCurrency }   from "@/lib/utils";
import Link                 from "next/link";

export const metadata: Metadata = { title: "Painel Médico" };

const ICONS = {
  calendar: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  hourglass: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  emptyCalendar: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
};

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/auth/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTotal, pending, completed, revenueAgg, activeNow, nextUp] =
    await prisma.$transaction([
      prisma.consultation.count({
        where: { doctorId: session.user.id, scheduledAt: { gte: today, lt: tomorrow } },
      }),
      prisma.consultation.count({
        where: { doctorId: session.user.id, status: { in: ["SCHEDULED", "WAITING"] } },
      }),
      prisma.consultation.count({
        where: { doctorId: session.user.id, status: "COMPLETED" },
      }),
      prisma.payment.aggregate({
        where:  { consultation: { doctorId: session.user.id }, status: "RECEIVED" },
        _sum:   { amount: true },
      }),
      prisma.consultation.findMany({
        where:   { doctorId: session.user.id, status: { in: ["IN_PROGRESS", "WAITING"] } },
        include: { patient: true, doctor: true, payment: true },
        orderBy: { scheduledAt: "asc" },
        take:    3,
      }),
      prisma.consultation.findMany({
        where:   { doctorId: session.user.id, status: "SCHEDULED", scheduledAt: { gte: today } },
        include: { patient: true, doctor: true, payment: true },
        orderBy: { scheduledAt: "asc" },
        take:    5,
      }),
    ]);

  const firstName = session.user.name.split(" ")[0] ?? session.user.name;

  return (
    <DashboardShell>
      <PageHeader
        badge="Painel médico"
        title={`Bom dia, Dr(a). ${firstName}`}
        description="Sua agenda e atendimentos do dia."
        action={
          <Link
            href="/dashboard/doctor/queue"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Fila de atendimento
          </Link>
        }
      />

      {/*
        Split: a plataforma retém uma comissão sobre cada consulta paga.
        Configurável via env DOCTOR_REVENUE_PCT (default 70%).
      */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Hoje"        value={String(todayTotal)} tone="brand"  icon={ICONS.calendar} />
        <StatCard label="Pendentes"   value={String(pending)}    tone="amber"  icon={ICONS.hourglass} />
        <StatCard label="Concluídas"  value={String(completed)}  tone="teal"   icon={ICONS.check} />
        {(() => {
          const gross   = Number(revenueAgg._sum.amount ?? 0);
          const pct     = Number(process.env["DOCTOR_REVENUE_PCT"] ?? 70) / 100;
          const net     = gross * pct;
          const fee     = gross - net;
          const pctLbl  = `${Math.round(pct * 100)}%`;
          return (
            <StatCard
              label="Receita líquida"
              value={formatCurrency(net)}
              tone="indigo"
              icon={ICONS.cash}
              hint={`Você recebe ${pctLbl} · Bruto ${formatCurrency(gross)}${fee > 0 ? ` · Taxa ${formatCurrency(fee)}` : ""}`}
            />
          );
        })()}
      </div>

      {/* Live now */}
      {activeNow.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Ao vivo agora
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeNow.map((c) => (
              <ConsultationCard key={c.id} consultation={c} role="doctor" />
            ))}
          </div>
        </div>
      )}

      {/* Next scheduled */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Próximas agendadas
            </h2>
            <p className="text-sm text-slate-500">Pacientes confirmados em ordem</p>
          </div>
          <Link
            href="/dashboard/doctor/consultations"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        {nextUp.length === 0 ? (
          <EmptyState
            icon={ICONS.emptyCalendar}
            title="Nenhuma consulta agendada"
            description="Sua agenda está livre. Novas consultas aparecerão aqui assim que forem marcadas."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nextUp.map((c) => (
              <ConsultationCard key={c.id} consultation={c} role="doctor" />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
