import type { Metadata } from "next";
import { auth }          from "@/lib/auth";
import { redirect }      from "next/navigation";
import { prisma }        from "@/lib/prisma";
import {
  DashboardShell, PageHeader, EmptyState,
} from "@/components/layout/DashboardShell";
import { PatientPrescriptionCard } from "@/components/patient/PrescriptionCard";

export const metadata: Metadata = { title: "Minhas receitas" };
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  COMUM:             "Receita Comum",
  COMUM_DUAS_VIAS:   "Antimicrobiano",
  CONTROLE_ESPECIAL: "Controle Especial",
  AZUL_B1:           "Azul B1",
  AZUL_B2:           "Azul B2",
  AMARELA_A1:        "Amarela A1",
  AMARELA_A2:        "Amarela A2",
  AMARELA_A3:        "Amarela A3",
};

export default async function PatientPrescriptionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const prescriptions = await prisma.prescription.findMany({
    where:  { patientId: session.user.id, status: "ISSUED" },
    include: {
      items: { orderBy: { order: "asc" } },
      consultation: {
        include: {
          doctor: { include: { doctorProfile: true } },
        },
      },
    },
    orderBy: { issuedAt: "desc" },
    take: 50,
  });

  return (
    <DashboardShell>
      <PageHeader
        badge="Minhas receitas"
        title="Receituários emitidos"
        description={`${prescriptions.length} receita(s) ativas`}
      />

      {prescriptions.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25" />
            </svg>
          }
          title="Nenhuma receita ainda"
          description="As receitas emitidas durante as consultas aparecem aqui."
        />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((p) => {
            const doctor  = p.consultation.doctor;
            const profile = doctor?.doctorProfile;
            return (
              <PatientPrescriptionCard
                key={p.id}
                prescription={{
                  id:        p.id,
                  type:      p.type,
                  typeLabel: TYPE_LABELS[p.type] ?? p.type,
                  issuedAt:  p.issuedAt?.toISOString()  ?? null,
                  expiresAt: p.expiresAt?.toISOString() ?? null,
                  notes:     p.notes,
                  items:     p.items.map((it) => ({
                    id:             it.id,
                    name:           it.name,
                    commercialName: it.commercialName,
                    presentation:   it.presentation,
                    dosage:         it.dosage,
                    route:          it.route,
                    frequency:      it.frequency,
                    duration:       it.duration,
                    instructions:   it.instructions,
                  })),
                  doctor: doctor
                    ? {
                        name:     doctor.name,
                        crm:      profile?.crm      ?? null,
                        crmState: profile?.crmState ?? null,
                      }
                    : null,
                }}
              />
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
