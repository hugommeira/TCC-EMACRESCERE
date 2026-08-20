import type { Metadata }  from "next";
import { auth }           from "@/lib/auth";
import { redirect }       from "next/navigation";
import { prisma }         from "@/lib/prisma";
import {
  DashboardShell,
  PageHeader,
  StatCard,
  SectionCard,
  EmptyState,
} from "@/components/layout/DashboardShell";
import { ConsultationCard } from "@/components/patient/ConsultationCard";
import { formatCurrency }   from "@/lib/utils";
import Link                 from "next/link";

export const metadata: Metadata = { title: "Meu painel" };

const ICONS = {
  calendar: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  hourglass: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h12M6 22h12M6 2v6l6 4-6 4v6M18 2v6l-6 4 6 4v6" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
      <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" />
    </svg>
  ),
  stethoscope: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v6a4 4 0 0 0 8 0V3M9 13v3a4 4 0 0 0 8 0v-3M17 13a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
    </svg>
  ),
};

export default async function PatientDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [total, upcoming, completed, revenueAgg, nextConsultations] =
    await prisma.$transaction([
      prisma.consultation.count({ where: { patientId: session.user.id } }),
      prisma.consultation.count({
        where: { patientId: session.user.id, status: { in: ["SCHEDULED", "WAITING"] } },
      }),
      prisma.consultation.count({
        where: { patientId: session.user.id, status: "COMPLETED" },
      }),
      prisma.payment.aggregate({
        where:  { consultation: { patientId: session.user.id }, status: "RECEIVED" },
        _sum:   { amount: true },
      }),
      prisma.consultation.findMany({
        where:   { patientId: session.user.id, status: { in: ["SCHEDULED", "WAITING", "IN_PROGRESS"] } },
        include: { patient: true, doctor: true, payment: true },
        orderBy: { scheduledAt: "asc" },
        take:    3,
      }),
    ]);

  const firstName = session.user.name.split(" ")[0] ?? session.user.name;

  return (
    <DashboardShell>
      <PageHeader
        badge={`Olá, ${firstName}`}
        title="Sua jornada de emagrecimento"
        description="Acompanhe consultas, prescrições e seu progresso."
        action={
          <Link
            href="/dashboard/patient/queue"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Atendimento agora
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total"      value={String(total)}     tone="brand"  icon={ICONS.calendar} />
        <StatCard label="Próximas"   value={String(upcoming)}  tone="amber"  icon={ICONS.hourglass} />
        <StatCard label="Concluídas" value={String(completed)} tone="teal"   icon={ICONS.check} />
        <StatCard label="Investido"  value={formatCurrency(Number(revenueAgg._sum.amount ?? 0))} tone="indigo" icon={ICONS.wallet} />
      </div>

      {/* Upcoming */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Próximas consultas
            </h2>
            <p className="text-sm text-slate-500">
              Suas consultas agendadas em ordem cronológica
            </p>
          </div>
          <Link
            href="/dashboard/patient/consultations"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        {nextConsultations.length === 0 ? (
          <EmptyState
            icon={ICONS.stethoscope}
            title="Nenhuma consulta agendada"
            description="Quando você marcar uma consulta, ela aparece aqui com todos os detalhes."
            action={
              <Link
                href="/dashboard/patient/queue"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
              >
                Solicitar atendimento
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nextConsultations.map((c) => (
              <ConsultationCard key={c.id} consultation={c} role="patient" />
            ))}
          </div>
        )}
      </div>

      {/* Tip card */}
      <SectionCard
        className="mt-10 overflow-hidden bg-gradient-to-br from-brand-50 via-white to-teal-50/50"
        title="Dica do dia"
        description="Pequenas mudanças trazem grandes resultados"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { t: "Hidratação", d: "Beba 2L de água por dia para potencializar o metabolismo." },
            { t: "Movimento",  d: "30 minutos de caminhada ajudam na sensibilidade à insulina." },
            { t: "Sono",       d: "Dormir 7-8h regula hormônios da fome (grelina e leptina)." },
          ].map((tip) => (
            <div key={tip.t} className="rounded-xl bg-white/70 p-4 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">{tip.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{tip.d}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
