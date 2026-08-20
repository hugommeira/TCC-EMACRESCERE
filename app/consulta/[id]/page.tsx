import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth }   from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConsultationRoom } from "@/components/consulta/ConsultationRoom";

export const metadata: Metadata = { title: "Consulta" };
export const dynamic = "force-dynamic";

function calcAge(birthDate: Date | null | undefined): string | null {
  if (!birthDate) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return `${age} anos`;
}

export default async function ConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const c = await prisma.consultation.findUnique({
    where: { id },
    select: {
      id: true, status: true, patientId: true, doctorId: true,
      chiefComplaint: true, diagnosis: true, conduct: true, notes: true,
      startedAt: true, endedAt: true, updatedAt: true,
      claimedAt: true, patientLastSeenAt: true,
      patient: {
        select: {
          id: true, name: true,
          patientProfile: {
            select: {
              birthDate:   true,
              gender:      true,
              bloodType:   true,
              allergies:   true,
              medications: true,
            },
          },
        },
      },
      doctor: {
        select: {
          id: true, name: true,
          doctorProfile: { select: { crm: true, specialty: true } },
        },
      },
    },
  });

  if (!c) notFound();

  const isDoctor      = c.doctorId === session.user.id;
  const isPatient     = c.patientId === session.user.id;
  if (!isDoctor && !isPatient) redirect("/");

  if (c.status !== "IN_PROGRESS" && c.status !== "COMPLETED") {
    // Ainda na fila ou cancelada
    redirect(isPatient ? `/dashboard/patient/queue/${id}` : "/dashboard/doctor/queue");
  }

  return (
    <ConsultationRoom
      consultationId={c.id}
      isDoctor={isDoctor}
      myUserId={session.user.id}
      patientName={c.patient.name}
      patientAge={calcAge(c.patient.patientProfile?.birthDate)}
      patientGender={c.patient.patientProfile?.gender ?? null}
      patientBloodType={c.patient.patientProfile?.bloodType ?? null}
      patientMedications={c.patient.patientProfile?.medications ?? []}
      allergies={c.patient.patientProfile?.allergies ?? []}
      doctorName={c.doctor?.name ?? null}
      initialStatus={c.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS"}
      startedAt={c.startedAt?.toISOString() ?? null}
      endedAt={c.endedAt?.toISOString() ?? null}
      claimedAt={c.claimedAt?.toISOString() ?? null}
      patientLastSeenAt={c.patientLastSeenAt?.toISOString() ?? null}
      initialUpdatedAt={c.updatedAt?.toISOString() ?? null}
      initialProntuario={{
        chiefComplaint: c.chiefComplaint,
        diagnosis:      c.diagnosis,
        conduct:        c.conduct,
        notes:          c.notes,
      }}
      doctorInfo={
        c.doctor
          ? {
              name:      c.doctor.name,
              ...(c.doctor.doctorProfile?.crm ? { crm: c.doctor.doctorProfile.crm } : {}),
              ...(c.doctor.doctorProfile?.specialty ? { specialty: c.doctor.doctorProfile.specialty } : {}),
            }
          : null
      }
    />
  );
}
