import type { Metadata } from "next";
import { Suspense }      from "react";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { ScheduleWizard } from "@/components/patient/ScheduleWizard";
import { SkeletonCard }   from "@/components/ui";

export const metadata: Metadata = { title: "Agendar consulta" };

export default function SchedulePage() {
  return (
    <DashboardShell>
      <PageHeader
        title="Agendar consulta"
        description="Escolha o médico, horário e forma de pagamento"
      />
      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      }>
        <ScheduleWizard />
      </Suspense>
    </DashboardShell>
  );
}
