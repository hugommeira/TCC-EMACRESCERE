import type { Metadata } from "next";
import { requireRole }   from "@/lib/auth";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { WeightPanel }   from "@/components/weight";
import { MeasuresPanel } from "@/components/measures/MeasuresPanel";

export const metadata: Metadata = { title: "Peso e medidas" };
export const dynamic  = "force-dynamic";

export default async function PatientWeightPage() {
  await requireRole("PATIENT");

  return (
    <DashboardShell>
      <PageHeader
        badge="Acompanhamento"
        title="Peso e medidas"
        description="Registre suas pesagens e outras medidas e acompanhe a evolução. O seu médico vê este histórico durante a consulta."
      />
      <div className="space-y-6">
        <WeightPanel mode="patient" />
        <MeasuresPanel mode="patient" />
      </div>
    </DashboardShell>
  );
}
