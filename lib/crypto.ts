import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;       // GCM padrão
const TAG_LEN = 16;

function getKey(): Buffer {
  const hex = process.env["PFX_ENCRYPTION_KEY"];
  if (!hex) throw new Error("PFX_ENCRYPTION_KEY não configurada");
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) throw new Error("PFX_ENCRYPTION_KEY precisa ser 32 bytes (64 hex chars)");
  return buf;
}

/** Encripta string -> formato base64(iv).base64(ciphertext).base64(authTag) */
export function encrypt(plaintext: string): string {
  const key    = getKey();
  const iv     = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct     = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString("base64")}.${ct.toString("base64")}.${tag.toString("base64")}`;
}

/** Descripta formato gerado por encrypt(). Lança erro se autenticação falhar. */
export function decrypt(encoded: string): string {
  const parts = encoded.split(".");
  if (parts.length !== 3) throw new Error("Formato de cipher inválido");
  const [ivB64, ctB64, tagB64] = parts;
  if (!ivB64 || !ctB64 || !tagB64) throw new Error("Formato de cipher inválido");

  const key      = getKey();
  const iv       = Buffer.from(ivB64,  "base64");
  const ct       = Buffer.from(ctB64,  "base64");
  const tag      = Buffer.from(tagB64, "base64");
  if (tag.length !== TAG_LEN) throw new Error("AuthTag inválido");

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
