import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/DashboardShell";
import { calculateBmi, formatWeight } from "@/lib/bmi";
import { formatDateTime } from "@/lib/utils";

// Resumo no topo do perfil (componente de servidor: só contagens do próprio usuário).

export async function PatientSummary({ userId, heightCm }: { userId: string; heightCm: number | null }) {
  const [concluidas, proxima, ultimoPeso] = await Promise.all([
    prisma.consultation.count({ where: { patientId: userId, status: "COMPLETED" } }),
    prisma.consultation.findFirst({
      where:   { patientId: userId, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      select:  { scheduledAt: true },
    }),
    prisma.weightRecord.findFirst({
      where:   { patientId: userId },
      orderBy: { measuredAt: "desc" },
      select:  { weightKg: true },
    }),
  ]);

  const peso = ultimoPeso ? Number(ultimoPeso.weightKg.toString()) : null;
  const imc  = peso != null ? calculateBmi(peso, heightCm) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      <StatCard label="Consultas feitas" value={String(concluidas)} tone="brand" href="/dashboard/patient/consultations" />
      <StatCard
        label="Próxima consulta"
        value={proxima?.scheduledAt ? formatDateTime(proxima.scheduledAt) : "Nenhuma"}
        tone="teal"
        {...(proxima ? {} : { hint: "Agende quando quiser", href: "/dashboard/patient/schedule" })}
      />
      <StatCard
        label="Peso atual"
        value={peso != null ? formatWeight(peso) : "—"}
        tone="amber"
        href="/dashboard/patient/peso"
        className="col-span-2 lg:col-span-1"
        {...(imc != null ? { hint: `IMC ${imc.value.toFixed(1).replace(".", ",")} · ${imc.label}` } : peso == null ? { hint: "Registre na aba Peso" } : {})}
      />
    </div>
  );
}

export async function DoctorSummary({ userId }: { userId: string }) {
  const [concluidas, pacientes, receitas] = await Promise.all([
    prisma.consultation.count({ where: { doctorId: userId, status: "COMPLETED" } }),
    prisma.consultation.groupBy({ by: ["patientId"], where: { doctorId: userId, status: "COMPLETED" } }),
    prisma.prescription.count({ where: { doctorId: userId, status: "ISSUED" } }),
  ]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      <StatCard label="Atendimentos" value={String(concluidas)} tone="brand" href="/dashboard/doctor/consultations" />
      <StatCard label="Pacientes atendidos" value={String(pacientes.length)} tone="teal" />
      <StatCard
        label="Receitas emitidas" value={String(receitas)} tone="indigo"
        href="/dashboard/doctor/prescriptions" className="col-span-2 lg:col-span-1"
      />
    </div>
  );
}
