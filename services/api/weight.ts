import { prisma }        from "@/lib/prisma";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { calculateBmi, healthyWeightCeilingKg } from "@/lib/bmi";
import type { BmiResult } from "@/lib/bmi";
import type { WeightRange } from "@/lib/validations/weight";

// ─── Formato que vai pro cliente ──────────────────────────────────────────────
//
// O Prisma devolve Decimal, que não sobrevive ao JSON de forma previsível —
// por isso tudo sai daqui como number.

export interface WeightPoint {
  id:         string;
  weightKg:   number;
  measuredAt: string;      // ISO, UTC
  note:       string | null;
  source:     "PATIENT" | "DOCTOR";
  recordedBy: string | null;
  bmi:        BmiResult | null;
}

export interface WeightSummary {
  heightCm:     number | null;
  goalWeightKg: number | null;
  /** Sugestão de meta (topo da faixa de peso normal), quando há altura. */
  healthyCeilingKg: number | null;
  current:      WeightPoint | null;
  first:        WeightPoint | null;
  /** Variação entre a primeira e a última pesagem do período pedido. */
  deltaKg:      number | null;
  /** Variação desde a pesagem anterior à última. */
  lastChangeKg: number | null;
  count:        number;
}

export interface WeightHistory {
  summary: WeightSummary;
  points:  WeightPoint[];
}

// ─── Autorização ──────────────────────────────────────────────────────────────

/**
 * Quem pode ver/registrar o peso de um paciente:
 *  - o próprio paciente;
 *  - um médico que tenha (ou tenha tido) consulta com ele;
 *  - admin.
 *
 * Devolve o papel de quem pediu, porque o registro do médico é gravado com
 * source = DOCTOR.
 */
async function assertCanAccess(
  patientId:   string,
  requesterId: string,
  requesterRole: string,
): Promise<"SELF" | "DOCTOR" | "ADMIN"> {
  if (patientId === requesterId) return "SELF";

  if (requesterRole === "ADMIN" || requesterRole === "SUPER_ADMIN") return "ADMIN";

  if (requesterRole === "DOCTOR") {
    const vinculo = await prisma.consultation.findFirst({
      where:  { patientId, doctorId: requesterId },
      select: { id: true },
    });
    if (!vinculo) {
      throw new ForbiddenError("Você não atende este paciente");
    }
    return "DOCTOR";
  }

  throw new ForbiddenError();
}

// ─── Período ──────────────────────────────────────────────────────────────────

const DIAS_POR_RANGE: Record<Exclude<WeightRange, "all">, number> = {
  "30d":  30,
  "90d":  90,
  "180d": 180,
  "365d": 365,
};

function inicioDoPeriodo(range: WeightRange, agora = new Date()): Date | null {
  if (range === "all") return null;
  const dias = DIAS_POR_RANGE[range];
  return new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

type RegistroComAutor = {
  id: string;
  weightKg: { toString(): string };
  measuredAt: Date;
  note: string | null;
  source: "PATIENT" | "DOCTOR";
  recordedBy: { name: string } | null;
};

function toPoint(r: RegistroComAutor, heightCm: number | null): WeightPoint {
  const weightKg = Number(r.weightKg.toString());
  return {
    id:         r.id,
    weightKg,
    measuredAt: r.measuredAt.toISOString(),
    note:       r.note,
    source:     r.source,
    recordedBy: r.recordedBy?.name ?? null,
    bmi:        calculateBmi(weightKg, heightCm),
  };
}

export async function getWeightHistory(
  patientId:     string,
  requesterId:   string,
  requesterRole: string,
  range:         WeightRange = "all",
): Promise<WeightHistory> {
  await assertCanAccess(patientId, requesterId, requesterRole);

  const perfil = await prisma.patientProfile.findUnique({
    where:  { userId: patientId },
    select: { heightCm: true, goalWeightKg: true },
  });

  const heightCm = perfil?.heightCm ?? null;
  const desde    = inicioDoPeriodo(range);

  const registros = await prisma.weightRecord.findMany({
    where: {
      patientId,
      ...(desde ? { measuredAt: { gte: desde } } : {}),
    },
    orderBy: { measuredAt: "asc" },
    select: {
      id: true, weightKg: true, measuredAt: true, note: true, source: true,
      recordedBy: { select: { name: true } },
    },
  });

  const points = registros.map((r: RegistroComAutor) => toPoint(r, heightCm));
  const first  = points[0] ?? null;
  const last   = points[points.length - 1] ?? null;
  const antes  = points.length > 1 ? points[points.length - 2]! : null;

  return {
    points,
    summary: {
      heightCm,
      goalWeightKg: perfil?.goalWeightKg != null ? Number(perfil.goalWeightKg.toString()) : null,
      healthyCeilingKg: healthyWeightCeilingKg(heightCm),
      current: last,
      first,
      deltaKg:      first && last && points.length > 1
        ? Math.round((last.weightKg - first.weightKg) * 10) / 10
        : null,
      lastChangeKg: antes && last
        ? Math.round((last.weightKg - antes.weightKg) * 10) / 10
        : null,
      count: points.length,
    },
  };
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

export async function createWeightRecord(opts: {
  patientId:     string;
  requesterId:   string;
  requesterRole: string;
  weightKg:      number;
  measuredAt?:   Date;
  note?:         string;
  consultationId?: string;
}): Promise<WeightPoint> {
  const papel = await assertCanAccess(opts.patientId, opts.requesterId, opts.requesterRole);

  const paciente = await prisma.user.findUnique({
    where:  { id: opts.patientId },
    select: { id: true, role: true },
  });
  if (!paciente || paciente.role !== "PATIENT") throw new NotFoundError("Paciente");

  // Se veio consulta junto, ela tem que ser desse paciente — e, se quem
  // registra é o médico, dele também.
  if (opts.consultationId) {
    const c = await prisma.consultation.findUnique({
      where:  { id: opts.consultationId },
      select: { patientId: true, doctorId: true },
    });
    if (!c || c.patientId !== opts.patientId) throw new NotFoundError("Consulta");
    if (papel === "DOCTOR" && c.doctorId !== opts.requesterId) {
      throw new ForbiddenError("Você não é o médico desta consulta");
    }
  }

  const registro = await prisma.weightRecord.create({
    data: {
      patientId:  opts.patientId,
      weightKg:   opts.weightKg,
      measuredAt: opts.measuredAt ?? new Date(),
      note:       opts.note ?? null,
      source:     papel === "DOCTOR" ? "DOCTOR" : "PATIENT",
      recordedById:   papel === "SELF" ? null : opts.requesterId,
      consultationId: opts.consultationId ?? null,
    },
    select: {
      id: true, weightKg: true, measuredAt: true, note: true, source: true,
      recordedBy: { select: { name: true } },
    },
  });

  const perfil = await prisma.patientProfile.findUnique({
    where:  { userId: opts.patientId },
    select: { heightCm: true },
  });

  return toPoint(registro, perfil?.heightCm ?? null);
}

/** Só quem registrou pode apagar — e o paciente, os próprios. */
export async function deleteWeightRecord(
  id:            string,
  requesterId:   string,
  requesterRole: string,
): Promise<void> {
  const registro = await prisma.weightRecord.findUnique({
    where:  { id },
    select: { patientId: true, recordedById: true, source: true },
  });
  if (!registro) throw new NotFoundError("Registro de peso");

  const ehDono       = registro.patientId === requesterId && registro.source === "PATIENT";
  const ehQuemGravou = registro.recordedById === requesterId;
  const ehAdmin      = requesterRole === "ADMIN" || requesterRole === "SUPER_ADMIN";

  if (!ehDono && !ehQuemGravou && !ehAdmin) throw new ForbiddenError();

  await prisma.weightRecord.delete({ where: { id } });
}

// ─── Altura e meta ────────────────────────────────────────────────────────────

export async function updatePatientMetrics(
  patientId: string,
  data: { heightCm?: number | null | undefined; goalWeightKg?: number | null | undefined },
): Promise<{ heightCm: number | null; goalWeightKg: number | null }> {
  const perfil = await prisma.patientProfile.upsert({
    where:  { userId: patientId },
    create: {
      userId: patientId,
      ...(data.heightCm     !== undefined ? { heightCm: data.heightCm } : {}),
      ...(data.goalWeightKg !== undefined ? { goalWeightKg: data.goalWeightKg } : {}),
    },
    update: {
      ...(data.heightCm     !== undefined ? { heightCm: data.heightCm } : {}),
      ...(data.goalWeightKg !== undefined ? { goalWeightKg: data.goalWeightKg } : {}),
    },
    select: { heightCm: true, goalWeightKg: true },
  });

  return {
    heightCm:     perfil.heightCm,
    goalWeightKg: perfil.goalWeightKg != null ? Number(perfil.goalWeightKg.toString()) : null,
  };
}
