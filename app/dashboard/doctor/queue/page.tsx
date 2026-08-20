import type { Metadata } from "next";
import { auth }          from "@/lib/auth";
import { redirect }      from "next/navigation";
import { listQueue }     from "@/services/api/queue";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { DoctorQueueLive } from "@/components/queue/DoctorQueueLive";

export const metadata: Metadata = { title: "Fila de espera" };
export const dynamic  = "force-dynamic";

export default async function DoctorQueuePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/auth/login");

  const items = await listQueue({ take: 50 });

  return (
    <DashboardShell>
      <PageHeader
        badge="Tempo real"
        title="Fila de espera"
        description="Pacientes aguardando atendimento, em ordem de chegada."
      />
      <DoctorQueueLive
        initial={items.map((i) => ({
          id:                i.id,
          enqueuedAt:        i.enqueuedAt?.toISOString() ?? new Date().toISOString(),
          chiefComplaint:    i.chiefComplaint,
          patientLastSeenAt: i.patientLastSeenAt?.toISOString() ?? null,
          patient: {
            id:        i.patient.id,
            name:      i.patient.name,
            avatarUrl: i.patient.avatarUrl,
            patientProfile: i.patient.patientProfile
              ? {
                  birthDate: i.patient.patientProfile.birthDate?.toISOString() ?? null,
                  gender:    i.patient.patientProfile.gender,
                  allergies: i.patient.patientProfile.allergies,
                }
              : null,
          },
        }))}
      />
    </DashboardShell>
  );
}
