import { prisma } from "@/lib/prisma";
import type { HistoricoConsulta } from "@/lib/prontuario-history";

/**
 * Histórico clínico: consultas concluídas deste paciente com ESTE médico,
 * da mais recente para a mais antiga. Só as dele, como o prontuário de um
 * consultório: o médico não lê o que outro profissional registrou. Usado pela
 * sala do site (app/consulta/[id]/page.tsx) e pelo app (GET
 * /api/consultations/[id]/history); quem chama garante que o usuário é o médico.
 */
export async function getPatientHistoryForDoctor(opts: {
  patientId:           string;
  doctorId:            string;
  excludeConsultationId: string;
  take?:               number;
}): Promise<HistoricoConsulta[]> {
  const past = await prisma.consultation.findMany({
    where: {
      patientId: opts.patientId,
      doctorId:  opts.doctorId,
      status:    "COMPLETED",
      id:        { not: opts.excludeConsultationId },
    },
    orderBy: { createdAt: "desc" },
    take:    opts.take ?? 20,
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

  return past.map((h) => ({
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
