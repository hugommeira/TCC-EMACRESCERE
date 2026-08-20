import type { Metadata }    from "next";
import { auth }              from "@/lib/auth";
import { redirect }          from "next/navigation";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { CertificateManager } from "@/components/doctor/CertificateManager";

export const metadata: Metadata = { title: "Certificado digital" };
export const dynamic = "force-dynamic";

export default async function CertificatePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/auth/login");

  return (
    <DashboardShell>
      <PageHeader
        badge="ICP-Brasil A1"
        title="Certificado digital"
        description="Necessário para emitir e assinar receitas conforme CFM 2.314/2022."
      />
      <div className="mx-auto max-w-2xl">
        <CertificateManager />
      </div>
    </DashboardShell>
  );
}
