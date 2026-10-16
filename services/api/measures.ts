import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { assertCanAccess } from "@/services/api/weight";
import { MEASURE_TYPES, waistToHeight, waistToHip, type MeasureType } from "@/lib/measures";

// Medidas do corpo (tabela BodyMeasurement). Mesmas regras de acesso do peso:
// paciente vê e registra as próprias; médico, só de paciente com quem tem
// consulta; admin lê.

export interface MeasurePoint {
  id:         string;
  value:      number;
  measuredAt: string;
  note:       string | null;
  source:     "PATIENT" | "DOCTOR";
  recordedBy: string | null;
  canDelete:  boolean;
}

export interface MeasuresHistory {
  series:  Record<MeasureType, MeasurePoint[]>;
  derived: {
    heightCm:      number | null;
    /** Relação cintura/estatura com a última cintura. */
    waistToHeight: number | null;
    /** Relação cintura/quadril com as últimas medidas de cada uma. */
    waistToHip:    number | null;
  };
}

function podeApagar(
  r: { patientId: string; recordedById: string | null; source: string },
  requesterId: string,
  requesterRole: string,
): boolean {
  return (r.patientId === requesterId && r.source === "PATIENT")
    || r.recordedById === requesterId
    || requesterRole === "ADMIN" || requesterRole === "SUPER_ADMIN";
}

export async function getMeasures(
  patientId: string,
  requesterId: string,
  requesterRole: string,
): Promise<MeasuresHistory> {
  await assertCanAccess(patientId, requesterId, requesterRole);

  const [registros, perfil] = await Promise.all([
    prisma.bodyMeasurement.findMany({
      where:   { patientId },
      orderBy: { measuredAt: "asc" },
      take:    1000,
      select: {
        id: true, type: true, value: true, measuredAt: true, note: true, source: true,
        patientId: true, recordedById: true,
        recordedBy: { select: { name: true } },
      },
    }),
    prisma.patientProfile.findUnique({ where: { userId: patientId }, select: { heightCm: true } }),
  ]);

  const series = Object.fromEntries(MEASURE_TYPES.map((t) => [t, [] as MeasurePoint[]])) as Record<MeasureType, MeasurePoint[]>;
  for (const r of registros) {
    const lista = series[r.type as MeasureType];
    if (!lista) continue; // tipo antigo que saiu do registro: ignora
    lista.push({
      id:         r.id,
      value:      Number(r.value.toString()),
      measuredAt: r.measuredAt.toISOString(),
      note:       r.note,
      source:     r.source,
      recordedBy: r.recordedBy?.name ?? null,
      canDelete:  podeApagar(r, requesterId, requesterRole),
    });
  }

  const ultimo = (t: MeasureType) => series[t].at(-1)?.value ?? null;
  const heightCm = perfil?.heightCm ?? null;

  return {
    series,
    derived: {
      heightCm,
      waistToHeight: waistToHeight(ultimo("waist"), heightCm),
      waistToHip:    waistToHip(ultimo("waist"), ultimo("hip")),
    },
  };
}

export async function createMeasure(opts: {
  patientId:       string;
  requesterId:     string;
  requesterRole:   string;
  type:            MeasureType;
  value:           number;
  measuredAt?:     Date | undefined;
  note?:           string | undefined;
  consultationId?: string | undefined;
}) {
  const papel = await assertCanAccess(opts.patientId, opts.requesterId, opts.requesterRole);
  if (papel === "ADMIN") throw new AppError("AUTH_SEM_PERMISSAO");

  const paciente = await prisma.user.findUnique({ where: { id: opts.patientId }, select: { role: true } });
  if (!paciente || paciente.role !== "PATIENT") throw new AppError("PESO_PACIENTE_NAO_ENCONTRADO");

  // Consulta junto: precisa ser desse paciente e, se é o médico, dele.
  if (opts.consultationId) {
    const c = await prisma.consultation.findUnique({
      where:  { id: opts.consultationId },
      select: { patientId: true, doctorId: true },
    });
    if (!c || c.patientId !== opts.patientId) throw new AppError("CONSULTA_NAO_ENCONTRADA");
    if (papel === "DOCTOR" && c.doctorId !== opts.requesterId) {
      throw new AppError("CONSULTA_SEM_ACESSO", { message: "Você não é o médico desta consulta." });
    }
  }

  return prisma.bodyMeasurement.create({
    data: {
      patientId:      opts.patientId,
      type:           opts.type,
      value:          opts.value,
      measuredAt:     opts.measuredAt ?? new Date(),
      note:           opts.note || null,
      source:         papel === "DOCTOR" ? "DOCTOR" : "PATIENT",
      recordedById:   papel === "SELF" ? null : opts.requesterId,
      consultationId: opts.consultationId ?? null,
    },
    select: { id: true, type: true, value: true, source: true },
  });
}

/** Só quem registrou apaga; o paciente, as próprias. */
export async function deleteMeasure(id: string, requesterId: string, requesterRole: string): Promise<void> {
  const r = await prisma.bodyMeasurement.findUnique({
    where:  { id },
    select: { patientId: true, recordedById: true, source: true },
  });
  if (!r) throw new AppError("MEDIDA_NAO_ENCONTRADA");
  if (!podeApagar(r, requesterId, requesterRole)) throw new AppError("AUTH_SEM_PERMISSAO");
  await prisma.bodyMeasurement.delete({ where: { id } });
}
