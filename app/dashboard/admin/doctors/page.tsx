import type { Metadata } from "next";
import { auth }          from "@/lib/auth";
import { redirect }      from "next/navigation";
import { DashboardShell, PageHeader, SectionCard, EmptyState } from "@/components/layout/DashboardShell";
import { listDoctorsForApproval } from "@/services/api/user";
import { DoctorApprovalCard, type DoctorForApproval } from "@/components/admin/DoctorApprovalCard";

export const metadata: Metadata = { title: "Médicos – Admin" };
export const dynamic  = "force-dynamic";

/**
 * Credenciamento de médicos. Quem se cadastra pelo app/site entra em
 * "Aguardando análise" e só atende depois de aprovado aqui. A verificação
 * do CRM mostrada no card é simulada (services/external/cfm.ts).
 */
export default async function AdminDoctorsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/auth/login");
  }

  const rows = await listDoctorsForApproval();
  const doctors: DoctorForApproval[] = rows
    .filter((d) => d.doctorProfile)
    .map((d) => ({
      id:        d.id,
      name:      d.name,
      email:     d.email,
      phone:     d.phone,
      cpf:       d.cpf,
      avatarUrl: d.avatarUrl,
      createdAt: d.createdAt.toISOString(),
      profile: {
        crm:             d.doctorProfile!.crm,
        crmState:        d.doctorProfile!.crmState,
        specialty:       d.doctorProfile!.specialty,
        approvalStatus:  d.doctorProfile!.approvalStatus,
        approvalNote:    d.doctorProfile!.approvalNote,
        approvedAt:      d.doctorProfile!.approvedAt?.toISOString() ?? null,
        crmVerifiedAt:   d.doctorProfile!.crmVerifiedAt?.toISOString() ?? null,
        crmVerification: (d.doctorProfile!.crmVerification as DoctorForApproval["profile"]["crmVerification"]) ?? null,
      },
    }));

  const pending  = doctors.filter((d) => d.profile.approvalStatus === "PENDING");
  const approved = doctors.filter((d) => d.profile.approvalStatus === "APPROVED");
  const rejected = doctors.filter((d) => d.profile.approvalStatus === "REJECTED");

  return (
    <DashboardShell>
      <PageHeader
        badge={pending.length > 0 ? `${pending.length} aguardando` : undefined}
        title="Médicos"
        description={`${approved.length} credenciados · ${pending.length} aguardando análise · ${rejected.length} reprovados`}
      />

      <SectionCard
        title="Aguardando credenciamento"
        description="Confira o CRM e aprove ou reprove. Reprovar exige um motivo, que o médico vê no app."
      >
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Nenhum cadastro pendente.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((d) => <DoctorApprovalCard key={d.id} doctor={d} />)}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Credenciados" className="mt-6">
        {approved.length === 0 ? (
          <EmptyState title="Nenhum médico credenciado" description="Aprove os cadastros pendentes acima." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((d) => <DoctorApprovalCard key={d.id} doctor={d} />)}
          </div>
        )}
      </SectionCard>

      {rejected.length > 0 && (
        <SectionCard title="Reprovados" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rejected.map((d) => <DoctorApprovalCard key={d.id} doctor={d} />)}
          </div>
        </SectionCard>
      )}
    </DashboardShell>
  );
}
