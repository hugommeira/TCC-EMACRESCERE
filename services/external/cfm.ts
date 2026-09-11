// Verificação de registro no CRM — SIMULADA.
//
// Não existe integração com o CFM/CRM aqui (decisão de escopo: o TCC não
// precisa da API real). Esta função imita o comportamento de uma consulta
// ao conselho pra o fluxo de credenciamento existir de ponta a ponta:
//
//   cadastro do médico -> verifyCrm() -> PENDING -> admin aprova/reprova
//
// Regras da simulação (documentadas pra quem for testar):
//   - CRM precisa ter 4 a 7 dígitos e a UF precisa ser válida
//   - CRM terminado em "000" -> "não encontrado" (pra demonstrar recusa)
//   - CRM terminado em "999" -> "registro suspenso" (pra demonstrar
//     situação irregular, que o admin deve reprovar)
//   - qualquer outro -> "ATIVO"
//
// Pra trocar pela API real basta reimplementar verifyCrm mantendo o
// retorno; quem chama (registerDoctor) não precisa mudar.

export const BRAZIL_UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export type CrmSituation = "ATIVO" | "SUSPENSO" | "NAO_ENCONTRADO";

export interface CrmVerificationResult {
  /** true só quando o registro existe e está ATIVO. */
  valid:      boolean;
  situation:  CrmSituation;
  crm:        string;
  crmState:   string;
  /** Nome como estaria no conselho (na simulação, ecoa o informado). */
  registeredName: string | null;
  checkedAt:  string;      // ISO
  source:     "simulado";  // deixa explícito no banco que não veio do CFM
  message:    string;
}

export async function verifyCrm(input: {
  crm:      string;
  crmState: string;
  name:     string;
}): Promise<CrmVerificationResult> {
  const crm      = input.crm.replace(/\D/g, "");
  const crmState = input.crmState.toUpperCase();
  const base = {
    crm,
    crmState,
    checkedAt: new Date().toISOString(),
    source:    "simulado" as const,
  };

  // Latência artificial pra parecer uma consulta externa.
  await new Promise((r) => setTimeout(r, 400));

  const ufOk  = (BRAZIL_UFS as readonly string[]).includes(crmState);
  const crmOk = /^\d{4,7}$/.test(crm);

  if (!ufOk || !crmOk || crm.endsWith("000")) {
    return {
      ...base,
      valid: false,
      situation: "NAO_ENCONTRADO",
      registeredName: null,
      message: `CRM ${crm}/${crmState} não encontrado no conselho (verificação simulada).`,
    };
  }

  if (crm.endsWith("999")) {
    return {
      ...base,
      valid: false,
      situation: "SUSPENSO",
      registeredName: input.name,
      message: `CRM ${crm}/${crmState} consta como SUSPENSO (verificação simulada).`,
    };
  }

  return {
    ...base,
    valid: true,
    situation: "ATIVO",
    registeredName: input.name,
    message: `CRM ${crm}/${crmState} ativo (verificação simulada).`,
  };
}
