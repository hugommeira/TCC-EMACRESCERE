import { randomBytes } from "node:crypto";
import * as forge from "node-forge";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { buildKey, putObject, deleteObject, getObjectBuffer, headObject } from "@/lib/s3";
import { extractPfxInfo, validatePfxPassword } from "@/lib/sign-pdf";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";

const MAX_PFX_SIZE = 5 * 1024 * 1024; // 5MB

// O .pfx vai pro storage criptografado (AES-256-GCM, PFX_ENCRYPTION_KEY). No
// modo sem S3 o arquivo e a senha dele moram no mesmo banco; sem isso, quem
// lesse a tabela teria as duas partes. O marcador identifica o formato novo —
// arquivo sem ele é lido como .pfx cru (compatível com o que já existisse).
const ENC_MARKER = Buffer.from("EMCPFX1:");

function sealPfx(pfx: Buffer): Buffer {
  return Buffer.concat([ENC_MARKER, Buffer.from(encrypt(pfx.toString("base64")))]);
}

function openPfx(stored: Buffer): Buffer {
  if (!stored.subarray(0, ENC_MARKER.length).equals(ENC_MARKER)) return stored;
  return Buffer.from(decrypt(stored.subarray(ENC_MARKER.length).toString()), "base64");
}

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

  // 4) Salvar no storage (S3 ou banco), criptografado
  const s3Key = buildKey(["certificates", `${input.doctorId}.pfx`]);
  try {
    await putObject({
      key:         s3Key,
      body:        sealPfx(input.pfxBuffer),
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
      active: true, createdAt: true, s3Key: true,
    },
  });
  if (!c) return null;
  // Registro sem arquivo (caso dos médicos da demo): a tela dizia "ativo", mas
  // a emissão falhava. Agora a tela sabe e pede pra recarregar.
  const { s3Key, ...info } = c;
  const fileAvailable = Boolean(await headObject(s3Key).catch(() => null));
  return { ...info, fileAvailable };
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

  // Antes lia direto do S3 (que nunca foi configurado): emitir receita falhava
  // sempre. Os médicos da demo tinham só o registro, sem arquivo nenhum.
  const file = await getObjectBuffer(c.s3Key);
  if (!file) {
    throw new ConflictError(
      "O arquivo do seu certificado não foi encontrado. Envie o .pfx de novo, ou gere um certificado de teste em Certificado digital.",
    );
  }

  return {
    pfxBuffer: openPfx(file.body),
    password:  decrypt(c.encryptedPassword),
    cert:      { subjectCN: c.subjectCN, serialNumber: c.serialNumber },
  };
}

// ─── Certificado de teste (demonstração) ─────────────────────────────────────

/**
 * Gera um certificado A1 AUTOASSINADO para o médico e o instala como se ele
 * tivesse feito o upload. Serve pra demonstrar a emissão de receita assinada
 * sem um certificado ICP-Brasil real (que custa e exige validação presencial).
 *
 * A receita sai assinada digitalmente, mas SEM validade jurídica: o emissor é o
 * próprio certificado, não uma AC da ICP-Brasil. O nome do certificado deixa
 * isso explícito ("CERTIFICADO DE TESTE"), e ele aparece assim no PDF.
 */
export async function generateTestCertificate(doctorId: string) {
  const doctor = await prisma.user.findUnique({
    where:  { id: doctorId },
    select: { name: true, email: true, doctorProfile: { select: { crm: true, crmState: true } } },
  });
  if (!doctor?.doctorProfile) throw new NotFoundError("Médico");

  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const cert = forge.pki.createCertificate();
  cert.publicKey    = keys.publicKey;
  cert.serialNumber = "01" + randomBytes(8).toString("hex");
  cert.validity.notBefore = new Date(Date.now() - 60_000);
  cert.validity.notAfter  = new Date(Date.now() + 365 * 24 * 60 * 60_000);

  const crm = `CRM ${doctor.doctorProfile.crm}/${doctor.doctorProfile.crmState}`;
  const attrs = [
    { name: "commonName",       value: `${doctor.name} - CERTIFICADO DE TESTE` },
    { name: "organizationName", value: "Emacrescere (sem validade juridica)" },
    { shortName: "OU",          value: crm },
    { name: "countryName",      value: "BR" },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs); // autoassinado
  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    { name: "keyUsage", digitalSignature: true, nonRepudiation: true },
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const password = randomBytes(18).toString("base64url");
  // TripleDES: o formato que o assinador (@signpdf/signer-p12) aceita.
  const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password, { algorithm: "3des" });
  const pfxBuffer = Buffer.from(forge.asn1.toDer(p12).getBytes(), "binary");

  return uploadCertificate({
    doctorId,
    pfxBuffer,
    password,
    fileName: "certificado-de-teste.pfx",
  });
}
