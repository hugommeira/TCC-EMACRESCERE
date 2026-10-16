import { CHAT_APOS_CONSULTA_HORAS } from "@/lib/constants";

// Quem pode MANDAR mensagem no chat de uma consulta, e até quando.
// Fonte única da regra (site, rotas das duas pilhas de chat e telas).
// Ler o histórico continua liberado para os participantes, sempre.
//
// - Em andamento (IN_PROGRESS) ou na sala de espera (WAITING): aberto.
// - Concluída (COMPLETED): aberto por CHAT_APOS_CONSULTA_HORAS depois do fim
//   (endedAt; se faltar, updatedAt), para dúvidas rápidas sobre a conduta.
// - Agendada, cancelada ou falta: fechado.

export type ChatAccessReason = "ATIVA" | "POS_CONSULTA" | "ENCERRADO" | "NAO_INICIADA" | "CANCELADA";

export interface ChatAccess {
  canSend:   boolean;
  /** Até quando dá para mandar (só na janela após a consulta). */
  sendUntil: Date | null;
  reason:    ChatAccessReason;
}

export interface ChatAccessInput {
  status:     string;
  endedAt?:   Date | string | null;
  updatedAt?: Date | string | null;
}

const HORA_MS = 60 * 60 * 1000;

export function getChatAccess(c: ChatAccessInput, now: Date = new Date()): ChatAccess {
  switch (c.status) {
    case "IN_PROGRESS":
    case "WAITING":
      return { canSend: true, sendUntil: null, reason: "ATIVA" };
    case "COMPLETED": {
      const fimRaw = c.endedAt ?? c.updatedAt ?? null;
      // Sem data nenhuma não há como contar o prazo: fecha.
      if (!fimRaw) return { canSend: false, sendUntil: null, reason: "ENCERRADO" };
      const until = new Date(new Date(fimRaw).getTime() + CHAT_APOS_CONSULTA_HORAS * HORA_MS);
      return now.getTime() < until.getTime()
        ? { canSend: true,  sendUntil: until, reason: "POS_CONSULTA" }
        : { canSend: false, sendUntil: until, reason: "ENCERRADO" };
    }
    case "CANCELLED":
    case "NO_SHOW":
      return { canSend: false, sendUntil: null, reason: "CANCELADA" };
    default:
      return { canSend: false, sendUntil: null, reason: "NAO_INICIADA" };
  }
}

/** Código do catálogo para recusar um envio fora da regra. */
export function chatBlockedCode(reason: ChatAccessReason): "CHAT_ENCERRADO" | "CONSULTA_ENCERRADA" | "CHAT_FORA_DA_CONSULTA" {
  if (reason === "ENCERRADO") return "CHAT_ENCERRADO";
  if (reason === "CANCELADA") return "CONSULTA_ENCERRADA";
  return "CHAT_FORA_DA_CONSULTA";
}
