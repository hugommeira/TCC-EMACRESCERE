import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { S3Client, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";

export { PutObjectCommand };

// ─── Armazenamento de arquivos ────────────────────────────────────────────────
//
// Dois modos, escolhidos pelas variáveis de ambiente:
// - S3 (Contabo Object Storage): quando todas as S3_* estão definidas.
// - Banco (tabela stored_files): quando não estão. Antes o projeto exigia o
//   S3 e, como ele nunca foi configurado, certificado A1, receita assinada,
//   PDF e anexos simplesmente não funcionavam — emitir receita era impossível.
//
// As funções exportadas têm a mesma assinatura nos dois modos, então quem as
// chama não precisa saber onde o arquivo mora.

const REQUIRED = ["S3_ENDPOINT","S3_REGION","S3_BUCKET","S3_ACCESS_KEY","S3_SECRET_KEY"] as const;

export function isS3Configured(): boolean {
  return REQUIRED.every((n) => Boolean(process.env[n]));
}

function env(name: typeof REQUIRED[number]): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável ${name} não configurada`);
  return v;
}

export const s3Bucket = () => env("S3_BUCKET");
export const s3Prefix = () => process.env["S3_PREFIX"] || "emacrescere/";

let _client: S3Client | undefined;
function client(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    endpoint:        env("S3_ENDPOINT"),
    region:          env("S3_REGION"),
    forcePathStyle:  true, // Contabo exige path-style
    credentials: {
      accessKeyId:     env("S3_ACCESS_KEY"),
      secretAccessKey: env("S3_SECRET_KEY"),
    },
  });
  return _client;
}

/** Gera key prefixada (ex: emacrescere/consultations/{id}/{file}) */
export function buildKey(parts: string[]): string {
  const clean = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return `${s3Prefix()}${clean}`;
}

// ─── Links de download assinados (modo banco) ────────────────────────────────
//
// Equivalente ao presigned URL do S3: um token com a key, o nome do arquivo e
// a validade, assinado com HMAC. Quem tem o link baixa até expirar; ninguém
// consegue forjar um link pra outra key.

function signingSecret(): string {
  const s = process.env["NEXTAUTH_SECRET"] ?? process.env["AUTH_SECRET"];
  if (!s) throw new Error("NEXTAUTH_SECRET não configurado (necessário pra assinar links de download)");
  return s;
}

interface DownloadClaims { k: string; f?: string; e: number }

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createDownloadToken(claims: DownloadClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Valida o token; devolve as claims ou null (assinatura inválida/expirado). */
export function readDownloadToken(token: string): DownloadClaims | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given    = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as DownloadClaims;
    if (typeof claims.k !== "string" || typeof claims.e !== "number") return null;
    if (claims.e < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

// ─── API usada pelo resto do sistema ─────────────────────────────────────────

/** Presigned PUT URL — cliente faz upload direto pro Contabo (só no modo S3). */
export async function presignUpload(params: {
  key:         string;
  contentType: string;
  expiresIn?:  number;
}): Promise<string> {
  if (!isS3Configured()) {
    throw new Error("Upload direto pelo navegador exige S3; use o upload pelo servidor");
  }
  const cmd = new PutObjectCommand({
    Bucket:      s3Bucket(),
    Key:         params.key,
    ContentType: params.contentType,
  });
  return getSignedUrl(client(), cmd, { expiresIn: params.expiresIn ?? 60 * 5 });
}

/** URL de download privado com validade. */
export async function presignDownload(params: {
  key:        string;
  fileName?:  string;
  expiresIn?: number;
}): Promise<string> {
  const expiresIn = params.expiresIn ?? 60 * 10;
  if (!isS3Configured()) {
    const token = createDownloadToken({
      k: params.key,
      ...(params.fileName ? { f: params.fileName } : {}),
      e: Date.now() + expiresIn * 1000,
    });
    return `/api/files/${token}`;
  }
  const cmd = new GetObjectCommand({
    Bucket: s3Bucket(),
    Key:    params.key,
    ...(params.fileName
      ? { ResponseContentDisposition: `attachment; filename="${params.fileName}"` }
      : {}),
  });
  return getSignedUrl(client(), cmd, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  if (!isS3Configured()) {
    await prisma.storedFile.deleteMany({ where: { key } });
    return;
  }
  await client().send(new DeleteObjectCommand({ Bucket: s3Bucket(), Key: key }));
}

/** Upload server-side. Aceita Buffer ou Uint8Array. */
export async function putObject(params: {
  key:         string;
  body:        Buffer | Uint8Array;
  contentType: string;
}): Promise<void> {
  if (!isS3Configured()) {
    const data = Buffer.from(params.body);
    await prisma.storedFile.upsert({
      where:  { key: params.key },
      create: { key: params.key, contentType: params.contentType, size: data.length, data },
      update: { contentType: params.contentType, size: data.length, data },
    });
    return;
  }
  await client().send(new PutObjectCommand({
    Bucket:      s3Bucket(),
    Key:         params.key,
    Body:        params.body,
    ContentType: params.contentType,
  }));
}

/** Conteúdo do arquivo, ou null se não existir. */
export async function getObjectBuffer(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  if (!isS3Configured()) {
    const f = await prisma.storedFile.findUnique({ where: { key } });
    return f ? { body: Buffer.from(f.data), contentType: f.contentType } : null;
  }
  try {
    const r = await client().send(new GetObjectCommand({ Bucket: s3Bucket(), Key: key }));
    if (!r.Body) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of r.Body as AsyncIterable<Buffer>) chunks.push(chunk);
    return { body: Buffer.concat(chunks), contentType: r.ContentType ?? "application/octet-stream" };
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw err;
  }
}

export async function headObject(key: string): Promise<{ size: number; mimeType: string } | null> {
  if (!isS3Configured()) {
    const f = await prisma.storedFile.findUnique({ where: { key }, select: { size: true, contentType: true } });
    return f ? { size: f.size, mimeType: f.contentType } : null;
  }
  try {
    const r = await client().send(new HeadObjectCommand({ Bucket: s3Bucket(), Key: key }));
    return {
      size:     Number(r.ContentLength ?? 0),
      mimeType: r.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}
