import "server-only";
import { randomBytes, createHash } from "node:crypto";

/** Gera um token opaco (enviado ao usuário) e seu hash (guardado no banco). */
export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

/** SHA-256 do token — o valor bruto nunca é persistido, só o hash. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
