import type { Metadata } from "next";
import { requireRole }   from "@/lib/auth";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { WeightPanel }   from "@/components/weight";

export const metadata: Metadata = { title: "Peso e IMC" };
export const dynamic  = "force-dynamic";

export default async function PatientWeightPage() {
  await requireRole("PATIENT");

  return (
    <DashboardShell>
      <PageHeader
        badge="Acompanhamento"
        title="Peso e IMC"
        description="Registre suas pesagens e acompanhe a evolução. O seu médico vê este histórico durante a consulta."
      />
      <WeightPanel mode="patient" />
    </DashboardShell>
  );
}
