import "server-only";
import { S3Client, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export { PutObjectCommand };

const REQUIRED = ["S3_ENDPOINT","S3_REGION","S3_BUCKET","S3_ACCESS_KEY","S3_SECRET_KEY"] as const;

function env(name: typeof REQUIRED[number]): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável ${name} não configurada`);
  return v;
}

export const s3Bucket = () => env("S3_BUCKET");
export const s3Prefix = () => process.env["S3_PREFIX"] ?? "emaerescere/";

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

/** Gera key prefixada (ex: emaerescere/consultations/{id}/{file}) */
export function buildKey(parts: string[]): string {
  const clean = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return `${s3Prefix()}${clean}`;
}

/** Presigned PUT URL — cliente faz upload direto pro Contabo */
export async function presignUpload(params: {
  key:         string;
  contentType: string;
  expiresIn?:  number;
}): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket:      s3Bucket(),
    Key:         params.key,
    ContentType: params.contentType,
  });
  return getSignedUrl(client(), cmd, { expiresIn: params.expiresIn ?? 60 * 5 });
}

/** Presigned GET URL — para download privado */
export async function presignDownload(params: {
  key:        string;
  fileName?:  string;
  expiresIn?: number;
}): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: s3Bucket(),
    Key:    params.key,
    ...(params.fileName
      ? { ResponseContentDisposition: `attachment; filename="${params.fileName}"` }
      : {}),
  });
  return getSignedUrl(client(), cmd, { expiresIn: params.expiresIn ?? 60 * 10 });
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: s3Bucket(), Key: key }));
}

/** Upload server-side. Aceita Buffer ou Uint8Array. */
export async function putObject(params: {
  key:         string;
  body:        Buffer | Uint8Array;
  contentType: string;
}): Promise<void> {
  await client().send(new PutObjectCommand({
    Bucket:      s3Bucket(),
    Key:         params.key,
    Body:        params.body,
    ContentType: params.contentType,
  }));
}

export async function headObject(key: string): Promise<{ size: number; mimeType: string } | null> {
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
