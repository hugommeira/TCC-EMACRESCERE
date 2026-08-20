import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { publish } from "@/lib/realtime";
import { buildKey, putObject, presignDownload } from "@/lib/s3";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { generatePrescriptionPdf } from "@/lib/prescription-pdf";
import { signPdf } from "@/lib/sign-pdf";
import { loadCertificateForSigning } from "./certificate";
import type { MedicationClass, PrescriptionType } from "@prisma/client";

// ─── Determinar tipo de receituário baseado nos itens ────────────────────────

const CLASS_PRIORITY: Record<MedicationClass, number> = {
  A1:                10,
  A2:                9,
  A3:                8,
  B1:                7,
  B2:                6,
  CONTROLE_ESPECIAL: 5,
  ANTIMICROBIANO:    4,
  GLP1:              1,
  COMUM:             0,
};

const CLASS_TO_TYPE: Record<MedicationClass, PrescriptionType> = {
  A1:                "AMARELA_A1",
  A2:                "AMARELA_A2",
  A3:                "AMARELA_A3",
  B1:                "AZUL_B1",
  B2:                "AZUL_B2",
  CONTROLE_ESPECIAL: "CONTROLE_ESPECIAL",
  ANTIMICROBIANO:    "COMUM_DUAS_VIAS",
  GLP1:              "COMUM",
  COMUM:             "COMUM",
};

export function inferTypeFromMedicationClasses(classes: MedicationClass[]): PrescriptionType {
  if (classes.length === 0) return "COMUM";
  let highest: MedicationClass = "COMUM";
  for (const c of classes) {
    if (CLASS_PRIORITY[c] > CLASS_PRIORITY[highest]) highest = c;
  }
  return CLASS_TO_TYPE[highest];
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export interface PrescriptionItemInput {
  medicationId?:  string;
  name:           string;
  commercialName?: string;
  presentation?:  string;
  dosage:         string;
  route?:         string;
  frequency:      string;
  duration?:      string;
  quantity?:      string;
  instructions?:  string;
  continuous?:    boolean;
}

export async function upsertPrescription(input: {
  consultationId: string;
  doctorId:       string;
  items:          PrescriptionItemInput[];
  notes?:         string;
}) {
  const consultation = await prisma.consultation.findUnique({
    where:  { id: input.consultationId },
    select: { id: true, doctorId: true, patientId: true, status: true },
  });
  if (!consultation) throw new NotFoundError("Consulta");
  if (consultation.doctorId !== input.doctorId) {
    throw new ForbiddenError("Você não é o médico desta consulta");
  }

  // Determinar tipo da receita pelos medicamentos vinculados
  const medIds = input.items.map((i) => i.medicationId).filter((x): x is string => !!x);
  const meds = medIds.length > 0
    ? await prisma.medication.findMany({
        where: { id: { in: medIds } },
        select: { id: true, class: true },
      })
    : [];
  const inferredType = inferTypeFromMedicationClasses(meds.map((m) => m.class));

  const existing = await prisma.prescription.findUnique({
    where: { consultationId: input.consultationId },
    select: { id: true, status: true },
  });
  if (existing?.status === "ISSUED") {
    throw new ConflictError("Receita já emitida — não pode ser editada");
  }

  const prescription = await prisma.$transaction(async (tx) => {
    const p = await tx.prescription.upsert({
      where:  { consultationId: input.consultationId },
      create: {
        consultationId: input.consultationId,
        doctorId:       input.doctorId,
        patientId:      consultation.patientId,
        status:         "DRAFT",
        type:           inferredType,
        ...(input.notes ? { notes: input.notes } : {}),
      },
      update: {
        type: inferredType,
        ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      },
    });

    await tx.prescriptionItem.deleteMany({ where: { prescriptionId: p.id } });

    if (input.items.length > 0) {
      await tx.prescriptionItem.createMany({
        data: input.items.map((it, idx) => ({
          prescriptionId: p.id,
          ...(it.medicationId ? { medicationId: it.medicationId } : {}),
          name:           it.name,
          ...(it.commercialName ? { commercialName: it.commercialName } : {}),
          ...(it.presentation  ? { presentation:  it.presentation  } : {}),
          dosage:         it.dosage,
          ...(it.route       ? { route:       it.route       } : {}),
          frequency:      it.frequency,
          ...(it.duration    ? { duration:    it.duration    } : {}),
          ...(it.quantity    ? { quantity:    it.quantity    } : {}),
          ...(it.instructions ? { instructions: it.instructions } : {}),
          continuous:     it.continuous ?? false,
          order:          idx,
        })),
      });
    }

    return p;
  });

  return getPrescription(prescription.id);
}

export async function getPrescription(prescriptionId: string) {
  return prisma.prescription.findUnique({
    where:  { id: prescriptionId },
    include: {
      items:        { orderBy: { order: "asc" } },
      consultation: {
        include: {
          patient: { include: { patientProfile: true } },
          doctor:  { include: { doctorProfile: true  } },
        },
      },
    },
  });
}

export async function getPrescriptionByConsultation(consultationId: string) {
  return prisma.prescription.findUnique({
    where:  { consultationId },
    include: {
      items: { orderBy: { order: "asc" } },
    },
  });
}

// ─── Emissão (assinar + salvar PDF) ──────────────────────────────────────────

export async function issuePrescription(input: {
  prescriptionId: string;
  doctorId:       string;
  appBaseUrl?:    string;
}) {
  const full = await getPrescription(input.prescriptionId);
  if (!full)                              throw new NotFoundError("Receita");
  if (full.doctorId !== input.doctorId)   throw new ForbiddenError("Não é seu");
  if (full.status === "ISSUED")           throw new ConflictError("Receita já emitida");
  if (full.items.length === 0)            throw new ConflictError("Adicione ao menos um medicamento");

  const doctor   = full.consultation.doctor;
  const profile  = full.consultation.doctor?.doctorProfile;
  if (!doctor || !profile) throw new ConflictError("Perfil do médico incompleto");

  const patient        = full.consultation.patient;
  const patientProfile = full.consultation.patient?.patientProfile;

  const cert = await loadCertificateForSigning(input.doctorId);

  const issuedAt  = new Date();
  const expiresAt = calculateExpiry(full.type, issuedAt);

  const pdfBuffer = await generatePrescriptionPdf({
    prescriptionId:  full.id,
    type:            full.type,
    issuedAt,
    doctorName:      doctor.name,
    doctorCrm:       profile.crm,
    doctorCrmState:  profile.crmState,
    ...(profile.specialty ? { doctorSpecialty: profile.specialty } : {}),
    patientName:     patient.name,
    ...(patient.cpf                  ? { patientCpf: patient.cpf } : {}),
    ...(patientProfile?.birthDate    ? { patientBirthDate: patientProfile.birthDate } : {}),
    items: full.items.map((it) => ({
      name:           it.name,
      ...(it.commercialName ? { commercialName: it.commercialName } : {}),
      ...(it.presentation   ? { presentation:  it.presentation   } : {}),
      dosage:         it.dosage,
      ...(it.route        ? { route:        it.route        } : {}),
      frequency:      it.frequency,
      ...(it.duration     ? { duration:     it.duration     } : {}),
      ...(it.quantity     ? { quantity:     it.quantity     } : {}),
      ...(it.instructions ? { instructions: it.instructions } : {}),
      continuous: it.continuous,
    })),
    ...(full.notes ? { notes: full.notes } : {}),
    ...(input.appBaseUrl ? { validationUrl: `${input.appBaseUrl}/prescricao/${full.id}` } : {}),
  });

  let signedPdf: Buffer;
  try {
    signedPdf = await signPdf(pdfBuffer, cert.pfxBuffer, cert.password, {
      reason:      `Receita médica — ${full.type}`,
      name:        cert.cert.subjectCN ?? doctor.name,
      location:    "BR",
      contactInfo: doctor.email,
    });
  } catch (err) {
    // Log completo
    console.error("[issuePrescription] sign error:", err);
    if (err instanceof Error && err.stack) console.error(err.stack);

    // Mensagens contextuais conforme tipo de falha
    const msg = err instanceof Error ? err.message : String(err);

    if (/invalid password|MAC|integrity/i.test(msg)) {
      throw new ConflictError("Senha do certificado A1 inválida. Recarregue o certificado em Configurações > Certificado.");
    }
    if (/Unsupported PKCS|Unsupported encryption|not implemented/i.test(msg)) {
      throw new ConflictError(
        "Algoritmo do certificado não suportado pelo servidor. " +
        "Exporte o .pfx em formato 'Compatibilidade — TripleDES-SHA1' no Adobe Reader / IcePalantir / Windows Certmgr.",
      );
    }
    throw new ConflictError(`Falha ao assinar a receita: ${msg}`);
  }

  const s3Key = buildKey(["prescriptions", full.consultationId, `${full.id}.pdf`]);
  await putObject({ key: s3Key, body: signedPdf, contentType: "application/pdf" });

  const sha256 = createHash("sha256").update(signedPdf).digest("hex");

  const updated = await prisma.prescription.update({
    where: { id: full.id },
    data:  {
      status:          "ISSUED",
      issuedAt,
      expiresAt,
      signedPdfKey:    s3Key,
      signatureCN:     cert.cert.subjectCN,
      signatureSerial: cert.cert.serialNumber,
      signatureHash:   sha256,
    },
  });

  await publish({
    channel: `patient:${full.patientId}`,
    type:    "patient.prescription_issued",
    data:    { prescriptionId: updated.id },
  });
  await publish({
    channel: `consultation:${full.consultationId}`,
    type:    "prescription.issued",
    data:    { prescriptionId: updated.id, type: updated.type, issuedAt, expiresAt },
  });

  return updated;
}

function calculateExpiry(type: PrescriptionType, issuedAt: Date): Date {
  const d = new Date(issuedAt);
  switch (type) {
    case "COMUM_DUAS_VIAS":   d.setDate(d.getDate() + 10);  break;
    case "AZUL_B1":
    case "AZUL_B2":
    case "AMARELA_A3":
    case "AMARELA_A1":
    case "AMARELA_A2":
    case "CONTROLE_ESPECIAL": d.setDate(d.getDate() + 30);  break;
    case "COMUM":             d.setDate(d.getDate() + 180); break;
  }
  return d;
}

// ─── PDF (presigned URL) ─────────────────────────────────────────────────────

export async function getPrescriptionPdfUrl(input: {
  prescriptionId: string;
  requesterId:    string;
  requesterRole:  "PATIENT" | "DOCTOR" | "ADMIN" | "SUPER_ADMIN";
}): Promise<string> {
  const p = await prisma.prescription.findUnique({
    where:  { id: input.prescriptionId },
    select: { signedPdfKey: true, patientId: true, doctorId: true, status: true },
  });
  if (!p)                          throw new NotFoundError("Receita");
  if (p.status !== "ISSUED" || !p.signedPdfKey) throw new ConflictError("Receita ainda não emitida");

  const allowed =
    p.patientId === input.requesterId ||
    p.doctorId  === input.requesterId ||
    input.requesterRole === "ADMIN" ||
    input.requesterRole === "SUPER_ADMIN";
  if (!allowed) throw new ForbiddenError("Sem permissão");

  return presignDownload({
    key:       p.signedPdfKey,
    fileName:  `receita-${input.prescriptionId.slice(-8)}.pdf`,
    expiresIn: 60 * 10,
  });
}

// ─── Validação pública ──────────────────────────────────────────────────────

export async function validatePrescription(prescriptionId: string, hash?: string) {
  const p = await prisma.prescription.findUnique({
    where:  { id: prescriptionId },
    select: {
      id: true, type: true, status: true, issuedAt: true, expiresAt: true,
      signatureCN: true, signatureSerial: true, signatureHash: true,
      consultation: {
        select: {
          doctor:  { select: { name: true, doctorProfile: { select: { crm: true, crmState: true } } } },
          patient: { select: { name: true } },
        },
      },
      items: { select: { name: true, dosage: true, frequency: true }, orderBy: { order: "asc" } },
    },
  });
  if (!p) return { valid: false, prescription: null };

  const valid =
    p.status === "ISSUED" &&
    (!p.expiresAt || p.expiresAt > new Date()) &&
    (!hash || p.signatureHash === hash);

  return { valid, prescription: p };
}
