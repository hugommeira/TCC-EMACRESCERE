import type { Metadata }  from "next";
import { auth }           from "@/lib/auth";
import { redirect }       from "next/navigation";
import { prisma }         from "@/lib/prisma";
import {
  DashboardShell, PageHeader, EmptyState, SectionCard,
} from "@/components/layout/DashboardShell";
import { Pagination } from "@/components/history/Pagination";
import { DoctorPrescriptionRow } from "@/components/doctor/DoctorPrescriptionRow";

export const metadata: Metadata = { title: "Minhas receitas" };
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  COMUM:             "Comum",
  COMUM_DUAS_VIAS:   "Antimicrobiano",
  CONTROLE_ESPECIAL: "Controle Especial",
  AZUL_B1:           "Azul B1",
  AZUL_B2:           "Azul B2",
  AMARELA_A1:        "Amarela A1",
  AMARELA_A2:        "Amarela A2",
  AMARELA_A3:        "Amarela A3",
};

const PT_DT = new Intl.DateTimeFormat("pt-BR", {
  day:    "2-digit",
  month:  "2-digit",
  year:   "2-digit",
  hour:   "2-digit",
  minute: "2-digit",
});

export default async function DoctorPrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/auth/login");

  const sp    = await searchParams;
  const page  = Number(sp.page ?? 1) || 1;
  const limit = 20;
  const skip  = (page - 1) * limit;

  const [items, total] = await prisma.$transaction([
    prisma.prescription.findMany({
      where: { doctorId: session.user.id },
      include: { items: true, consultation: { select: { patient: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: limit, skip,
    }),
    prisma.prescription.count({ where: { doctorId: session.user.id } }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <DashboardShell>
      <PageHeader badge="Histórico" title="Minhas receitas" description={`${total} receita(s) emitida(s)`} />

      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25" />
            </svg>
          }
          title="Você ainda não emitiu receitas"
          description="As receitas que você emitir nas consultas aparecem aqui."
        />
      ) : (
        <SectionCard title="Receitas" className="overflow-hidden">
          <div className="-mx-5 -mt-5 -mb-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Data</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Paciente</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Itens</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <DoctorPrescriptionRow
                    key={p.id}
                    row={{
                      id:          p.id,
                      createdAt:   PT_DT.format(p.createdAt),
                      patientName: p.consultation.patient.name,
                      typeLabel:   TYPE_LABELS[p.type] ?? p.type,
                      status:      p.status,
                      items: p.items.map((it) => ({
                        id:             it.id,
                        name:           it.name,
                        commercialName: it.commercialName,
                        presentation:   it.presentation,
                        dosage:         it.dosage,
                        route:          it.route,
                        frequency:      it.frequency,
                        duration:       it.duration,
                      })),
                    }}
                  />
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
