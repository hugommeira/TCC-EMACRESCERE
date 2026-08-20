import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { buildKey, putObject, deleteObject } from "@/lib/s3";
import { extractPfxInfo, validatePfxPassword } from "@/lib/sign-pdf";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";

const MAX_PFX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadCertificate(input: {
  doctorId: string;
  pfxBuffer: Buffer;
  password: string;
  fileName: string;
}) {
  if (input.pfxBuffer.length === 0 || input.pfxBuffer.length > MAX_PFX_SIZE) {
    throw new ConflictError("Arquivo .pfx inválido ou maior que 5MB");
  }
  if (!input.password) {
    throw new ConflictError("Senha do certificado é obrigatória");
  }

  // 1) Validar senha (obrigatório). Se falhar, lança ConflictError.
  try {
    validatePfxPassword(input.pfxBuffer, input.password);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Não foi possível abrir o .pfx";
    console.error("[uploadCertificate] validatePfxPassword failed:", err);
    throw new ConflictError(msg);
  }

  // 2) Extrair metadados (best-effort, não bloqueia o upload se falhar)
  let info = { subjectCN: null, issuerCN: null, serialNumber: null, validFrom: null, validTo: null } as Awaited<ReturnType<typeof extractPfxInfo>>;
  try {
    info = extractPfxInfo(input.pfxBuffer, input.password);
  } catch (err) {
    console.warn("[uploadCertificate] extractPfxInfo failed (continuing):", err instanceof Error ? err.message : err);
  }

  // 3) Remover certificado anterior (S3 + DB) — falha silenciosa
  try {
    const existing = await prisma.medicalCertificate.findUnique({
      where: { doctorId: input.doctorId },
      select: { id: true, s3Key: true },
    });
    if (existing) {
      try { await deleteObject(existing.s3Key); } catch (e) {
        console.warn("[uploadCertificate] cleanup old S3 object failed:", e);
      }
    }
  } catch (e) {
    console.warn("[uploadCertificate] lookup existing failed:", e);
  }

  // 4) Salvar no S3
  const s3Key = buildKey(["certificates", `${input.doctorId}.pfx`]);
  try {
    await putObject({
      key:         s3Key,
      body:        input.pfxBuffer,
      contentType: "application/x-pkcs12",
    });
  } catch (err) {
    console.error("[uploadCertificate] S3 putObject failed:", err);
    throw new ConflictError("Falha ao enviar o certificado para o storage. Verifique a conexão e tente novamente.");
  }

  // 5) Salvar metadados (senha encriptada)
  let encryptedPassword: string;
  try {
    encryptedPassword = encrypt(input.password);
  } catch (err) {
    console.error("[uploadCertificate] encrypt password failed:", err);
    throw new ConflictError("Erro de criptografia. Contate o suporte (PFX_ENCRYPTION_KEY).");
  }

  // exactOptionalPropertyTypes — montar objeto sem undefined
  const meta: {
    subjectCN?:    string;
    issuerCN?:     string;
    serialNumber?: string;
    validFrom?:    Date;
    validTo?:      Date;
  } = {};
  if (info.subjectCN)    meta.subjectCN    = info.subjectCN;
  if (info.issuerCN)     meta.issuerCN     = info.issuerCN;
  if (info.serialNumber) meta.serialNumber = info.serialNumber;
  if (info.validFrom)    meta.validFrom    = info.validFrom;
  if (info.validTo)      meta.validTo      = info.validTo;

  const cert = await prisma.medicalCertificate.upsert({
    where:  { doctorId: input.doctorId },
    create: {
      doctorId:          input.doctorId,
      s3Key,
      fileName:          input.fileName,
      encryptedPassword,
      ...meta,
    },
    update: {
      s3Key,
      fileName:          input.fileName,
      encryptedPassword,
      active:            true,
      ...meta,
    },
  });

  return {
    id:           cert.id,
    fileName:     cert.fileName,
    subjectCN:    cert.subjectCN,
    issuerCN:     cert.issuerCN,
    serialNumber: cert.serialNumber,
    validFrom:    cert.validFrom,
    validTo:      cert.validTo,
  };
}

export async function getCertificateInfo(doctorId: string) {
  const c = await prisma.medicalCertificate.findUnique({
    where: { doctorId },
    select: {
      id: true, fileName: true, subjectCN: true, issuerCN: true,
      serialNumber: true, validFrom: true, validTo: true,
      active: true, createdAt: true,
    },
  });
  return c;
}

export async function deleteCertificate(doctorId: string) {
  const c = await prisma.medicalCertificate.findUnique({
    where: { doctorId }, select: { id: true, s3Key: true },
  });
  if (!c) throw new NotFoundError("Certificado");
  try { await deleteObject(c.s3Key); } catch { /* ignore */ }
  await prisma.medicalCertificate.delete({ where: { id: c.id } });
}

/** Carrega .pfx + senha do médico, pronto pra usar em assinatura. */
export async function loadCertificateForSigning(doctorId: string): Promise<{
  pfxBuffer: Buffer;
  password:  string;
  cert:      { subjectCN: string | null; serialNumber: string | null };
}> {
  const c = await prisma.medicalCertificate.findUnique({
    where: { doctorId },
    select: { s3Key: true, encryptedPassword: true, subjectCN: true, serialNumber: true, active: true, validTo: true },
  });
  if (!c)               throw new NotFoundError("Certificado");
  if (!c.active)        throw new ForbiddenError("Certificado inativo");
  if (c.validTo && c.validTo < new Date()) {
    throw new ForbiddenError("Certificado expirado");
  }

  // Download .pfx do S3
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({
    endpoint: process.env["S3_ENDPOINT"]!,
    region:   process.env["S3_REGION"]!,
    forcePathStyle: true,
    credentials: {
      accessKeyId:     process.env["S3_ACCESS_KEY"]!,
      secretAccessKey: process.env["S3_SECRET_KEY"]!,
    },
  });
  const r = await s3.send(new GetObjectCommand({
    Bucket: process.env["S3_BUCKET"]!,
    Key:    c.s3Key,
  }));
  const chunks: Buffer[] = [];
  for await (const chunk of r.Body as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }

  return {
    pfxBuffer: Buffer.concat(chunks),
    password:  decrypt(c.encryptedPassword),
    cert:      { subjectCN: c.subjectCN, serialNumber: c.serialNumber },
  };
}
