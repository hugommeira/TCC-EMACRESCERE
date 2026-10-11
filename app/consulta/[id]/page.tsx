import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth }   from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConsultationRoom } from "@/components/consulta/ConsultationRoom";
import { DOCTOR_WORK_HREF } from "@/lib/constants";
import type { HistoricoConsulta } from "@/lib/prontuario-history";

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
              emergencyContactName:     true,
              emergencyContactPhone:    true,
              emergencyContactRelation: true,
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
    // Ainda não começou ou cancelada. Pro paciente, /dashboard/patient/queue/[id]
    // é a sala de espera da consulta (serve ao agendamento também).
    redirect(isPatient ? `/dashboard/patient/queue/${id}` : DOCTOR_WORK_HREF);
  }

  // Histórico clínico: consultas concluídas deste paciente com ESTE médico.
  // Só o médico recebe (props de componente cliente vão no payload da página)
  // e só as dele, como o prontuário de um consultório: o médico não lê o que
  // outro profissional registrou.
  let history: HistoricoConsulta[] = [];
  if (isDoctor) {
    const past = await prisma.consultation.findMany({
      where: {
        patientId: c.patientId,
        doctorId:  session.user.id,
        status:    "COMPLETED",
        id:        { not: c.id },
      },
      orderBy: { createdAt: "desc" },
      take:    20,
      select: {
        id: true, startedAt: true, scheduledAt: true, createdAt: true,
        chiefComplaint: true, diagnosis: true, conduct: true, notes: true,
        prescription: {
          select: {
            status: true,
            items: {
              orderBy: { order: "asc" },
              select: { name: true, dosage: true, frequency: true, duration: true },
            },
          },
        },
      },
    });
    history = past.map((h) => ({
      id:             h.id,
      date:           (h.startedAt ?? h.scheduledAt ?? h.createdAt).toISOString(),
      chiefComplaint: h.chiefComplaint,
      diagnosis:      h.diagnosis,
      conduct:        h.conduct,
      notes:          h.notes,
      medications:    h.prescription?.status === "ISSUED"
        ? h.prescription.items.map((i) =>
            [i.name, i.dosage, i.frequency, i.duration].filter(Boolean).join(" · "))
        : [],
    }));
  }

  return (
    <ConsultationRoom
      consultationId={c.id}
      isDoctor={isDoctor}
      myUserId={session.user.id}
      patientId={c.patient.id}
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
      history={history}
      emergencyContact={
        // Só o médico recebe (o paciente já sabe o próprio contato).
        isDoctor && c.patient.patientProfile?.emergencyContactName
          ? {
              name:     c.patient.patientProfile.emergencyContactName,
              phone:    c.patient.patientProfile.emergencyContactPhone,
              relation: c.patient.patientProfile.emergencyContactRelation,
            }
          : null
      }
      initialProntuario={{
        chiefComplaint: c.chiefComplaint,
        diagnosis:      c.diagnosis,
        conduct:        c.conduct,
        // Notas internas só pro médico: props de componente cliente vão no
        // payload da página, então esconder o campo na tela não bastava.
        notes:          isDoctor ? c.notes : null,
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
