import type { Metadata } from "next";
import { auth }          from "@/lib/auth";
import { redirect }      from "next/navigation";
import { prisma }        from "@/lib/prisma";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { StartConsultationForm }      from "@/components/queue/StartConsultationForm";
import { CONSULTATION_FEE_REAIS }     from "@/services/api/queue";

export const metadata: Metadata = { title: "Solicitar consulta" };
export const dynamic  = "force-dynamic";

export default async function PatientQueueIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  // Se já tem consulta ativa, redireciona pra ela
  const active = await prisma.consultation.findFirst({
    where: {
      patientId: session.user.id,
      status:    { in: ["SCHEDULED", "WAITING", "IN_PROGRESS"] },
    },
    select: { id: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  if (active) {
    if (active.status === "IN_PROGRESS") redirect(`/consulta/${active.id}`);
    redirect(`/dashboard/patient/queue/${active.id}`);
  }

  return (
    <DashboardShell>
      <PageHeader
        badge="Atendimento on-demand"
        title="Solicitar consulta"
        description="Pague e entre na fila — um médico atende em alguns minutos."
      />

      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <StartConsultationForm feeBRL={CONSULTATION_FEE_REAIS} />
      </div>
    </DashboardShell>
  );
}
