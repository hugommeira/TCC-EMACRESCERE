import type { Metadata, Route } from "next";
import Link               from "next/link";
import { requireRole }    from "@/lib/auth";
import { prisma }         from "@/lib/prisma";
import { DashboardShell, EmptyState } from "@/components/layout/DashboardShell";
import { ConsultationCard }  from "@/components/patient/ConsultationCard";
import { NextConsultation }  from "@/components/patient/NextConsultation";
import { WeightSnapshot }    from "@/components/patient/WeightSnapshot";
import { getWeightHistory }  from "@/services/api/weight";
import { greetingFor, doctorTitle, formatDate } from "@/lib/utils";
import { QUEUE_ENABLED, PATIENT_NEW_CONSULTATION_HREF } from "@/lib/constants";

export const metadata: Metadata = { title: "Meu painel" };
export const dynamic  = "force-dynamic";

// Ordem de importância de uma consulta ativa: a que está acontecendo, depois
// a fila, depois a agendada mais próxima.
const ACTIVE_RANK = { IN_PROGRESS: 0, WAITING: 1, SCHEDULED: 2 } as const;

export default async function PatientDashboardPage() {
  const session = await requireRole("PATIENT");
  const userId  = session.user.id;

  const [active, completed, lastPrescription, weight] = await Promise.all([
    prisma.consultation.findMany({
      where:   { patientId: userId, status: { in: ["SCHEDULED", "WAITING", "IN_PROGRESS"] } },
      include: {
        patient: true,
        payment: true,
        doctor:  { include: { doctorProfile: { select: { specialty: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take:    6,
    }),
    prisma.consultation.count({ where: { patientId: userId, status: "COMPLETED" } }),
    prisma.prescription.findFirst({
      where:   { patientId: userId, status: "ISSUED" },
      orderBy: { issuedAt: "desc" },
      select:  {
        issuedAt: true, expiresAt: true,
        _count:   { select: { items: true } },
        consultation: { select: { doctor: { select: { name: true } } } },
      },
    }),
    // O painel não pode cair se o histórico de peso falhar.
    getWeightHistory(userId, userId, "PATIENT", "180d").catch(() => null),
  ]);

  const sorted = [...active].sort((a, b) => ACTIVE_RANK[a.status as keyof typeof ACTIVE_RANK] - ACTIVE_RANK[b.status as keyof typeof ACTIVE_RANK]);
  const next   = sorted[0] ?? null;
  const others = sorted.slice(1, 4);

  const firstName = session.user.name.split(" ")[0] ?? session.user.name;

  return (
    <DashboardShell>
      {/* Saudação */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-rise">
          <p className="text-sm font-medium text-brand-700">{greetingFor()}, {firstName}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Seu acompanhamento
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {completed > 0
              ? `${completed} ${completed === 1 ? "consulta concluída" : "consultas concluídas"} até aqui.`
              : "Consultas, peso e receitas num lugar só."}
          </p>
        </div>
        <Link
          href={PATIENT_NEW_CONSULTATION_HREF}
          className="inline-flex min-h-[44px] animate-rise items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/40 sm:self-auto"
          style={{ animationDelay: "100ms" }}
        >
          {QUEUE_ENABLED ? "Atendimento agora" : "Agendar consulta"}
        </Link>
      </header>

      {/* Destaques */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="animate-rise lg:col-span-3" style={{ animationDelay: "150ms" }}>
          <NextConsultation
            c={next && {
              id:            next.id,
              status:        next.status,
              scheduledAt:   next.scheduledAt,
              paymentStatus: next.payment?.status ?? null,
              doctor:        next.doctor
                ? {
                    name:      next.doctor.name,
                    avatarUrl: next.doctor.avatarUrl,
                    specialty: next.doctor.doctorProfile?.specialty ?? null,
                  }
                : null,
            }}
          />
        </div>
        <div className="animate-rise lg:col-span-2" style={{ animationDelay: "250ms" }}>
          {weight ? (
            <WeightSnapshot summary={weight.summary} points={weight.points} />
          ) : (
            <EmptyState
              icon={<span aria-hidden>—</span>}
              title="Peso indisponível agora"
              description="Não conseguimos carregar seu histórico de peso. Tente de novo em instantes."
            />
          )}
        </div>
      </div>

      {/* Receita e atalhos */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <section
          aria-labelledby="ultima-receita"
          className="animate-rise rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7 lg:col-span-3"
          style={{ animationDelay: "350ms" }}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id="ultima-receita" className="text-sm font-semibold text-brand-700">Última receita</h2>
            <Link href="/dashboard/patient/prescriptions" className="text-sm font-medium text-brand-700 hover:underline">
              Ver receitas
            </Link>
          </div>
          {lastPrescription ? (
            <div className="mt-4 flex items-start gap-4">
              <span aria-hidden className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-700 ring-1 ring-brand-100">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M9 13h6M9 17h4" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {lastPrescription._count.items} {lastPrescription._count.items === 1 ? "item" : "itens"}
                  {lastPrescription.consultation.doctor && <> · {doctorTitle(lastPrescription.consultation.doctor.name)}</>}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {lastPrescription.issuedAt && <>Emitida em {formatDate(lastPrescription.issuedAt)}</>}
                  {lastPrescription.expiresAt && <> · válida até {formatDate(lastPrescription.expiresAt)}</>}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Assinada digitalmente pelo médico. Use-a em qualquer farmácia autorizada.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Se o médico indicar um tratamento com medicamento, a receita assinada aparece aqui.
            </p>
          )}
        </section>

        <nav
          aria-label="Atalhos"
          className="animate-rise grid grid-cols-2 gap-3 lg:col-span-2"
          style={{ animationDelay: "450ms" }}
        >
          {([
            { href: "/dashboard/patient/consultations", label: "Minhas consultas", d: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
            { href: "/dashboard/patient/peso",          label: "Registrar peso",   d: "M3 3v18h18M7 14l4-4 3 3 5-6" },
            { href: "/dashboard/patient/prescriptions", label: "Receitas",         d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
            { href: "/dashboard/patient/profile",       label: "Meu perfil",       d: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
          ] satisfies { href: Route; label: string; d: string }[]).map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col justify-between gap-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200"
            >
              <span aria-hidden className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-gradient-to-br group-hover:from-brand-500 group-hover:to-teal-500 group-hover:text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.d} />
                </svg>
              </span>
              <span className="text-sm font-semibold text-slate-900">{a.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Outras consultas ativas */}
      {others.length > 0 && (
        <section aria-labelledby="outras-consultas" className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="outras-consultas" className="font-display text-xl font-semibold text-slate-900">
              Outras consultas marcadas
            </h2>
            <Link href="/dashboard/patient/consultations" className="text-sm font-medium text-brand-700 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((c) => (
              <ConsultationCard key={c.id} consultation={c} role="patient" />
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-xs leading-relaxed text-slate-500">
        A Emacrescere não vende, indica nem dispensa medicamentos. Qualquer
        conduta clínica é decisão do médico responsável, em consulta.
      </p>
    </DashboardShell>
  );
}
