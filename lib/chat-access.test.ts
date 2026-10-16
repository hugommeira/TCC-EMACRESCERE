import { describe, expect, it } from "vitest";
import { chatBlockedCode, getChatAccess } from "./chat-access";

const fim = new Date("2026-10-15T15:00:00.000Z");
const h = (n: number) => new Date(fim.getTime() + n * 3600_000);

describe("getChatAccess", () => {
  it.each([
    ["IN_PROGRESS", true,  "ATIVA"],
    ["WAITING",     true,  "ATIVA"],
    ["SCHEDULED",   false, "NAO_INICIADA"],
    ["CANCELLED",   false, "CANCELADA"],
    ["NO_SHOW",     false, "CANCELADA"],
  ])("%s → canSend=%s (%s)", (status, canSend, reason) => {
    expect(getChatAccess({ status, endedAt: fim }, h(1))).toMatchObject({ canSend, reason });
  });

  it("concluída: aberto nas 24 h seguintes ao fim, com o prazo informado", () => {
    const a = getChatAccess({ status: "COMPLETED", endedAt: fim }, h(23.9));
    expect(a).toMatchObject({ canSend: true, reason: "POS_CONSULTA" });
    expect(a.sendUntil?.toISOString()).toBe(h(24).toISOString());
  });

  it("concluída: fecha exatamente nas 24 h e depois", () => {
    expect(getChatAccess({ status: "COMPLETED", endedAt: fim }, h(24)).canSend).toBe(false);
    expect(getChatAccess({ status: "COMPLETED", endedAt: fim }, h(48))).toMatchObject({ canSend: false, reason: "ENCERRADO" });
  });

  it("sem endedAt usa updatedAt; sem nenhuma data, fecha", () => {
    expect(getChatAccess({ status: "COMPLETED", endedAt: null, updatedAt: fim }, h(2)).canSend).toBe(true);
    expect(getChatAccess({ status: "COMPLETED" }, h(2))).toMatchObject({ canSend: false, reason: "ENCERRADO" });
  });

  it("aceita datas em texto (vindas do JSON)", () => {
    expect(getChatAccess({ status: "COMPLETED", endedAt: fim.toISOString() }, h(1)).canSend).toBe(true);
  });

  it("código de recusa por motivo", () => {
    expect(chatBlockedCode("ENCERRADO")).toBe("CHAT_ENCERRADO");
    expect(chatBlockedCode("CANCELADA")).toBe("CONSULTA_ENCERRADA");
    expect(chatBlockedCode("NAO_INICIADA")).toBe("CHAT_FORA_DA_CONSULTA");
  });
});
