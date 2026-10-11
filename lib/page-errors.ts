import "server-only";
import { notFound } from "next/navigation";
import { classifyError, logError } from "@/lib/errors";

/**
 * Para páginas de servidor que carregam um registro pelo id.
 *
 * Não existe ou não é seu (404/403): página 404 — não revela se o registro
 * existe. Qualquer outra falha (ex.: INFRA_BANCO_INDISPONIVEL) é relançada
 * para o error.tsx da área, que mostra "Tentar de novo". Antes todo erro,
 * inclusive banco fora do ar, aparecia como "página não encontrada".
 */
export function naoEncontradoOuLanca(err: unknown): never {
  const known = classifyError(err);
  if (known && (known.status === 404 || known.status === 403)) notFound();
  logError(known?.code ?? "ERRO_INTERNO", err, { origem: "pagina" });
  throw err;
}
