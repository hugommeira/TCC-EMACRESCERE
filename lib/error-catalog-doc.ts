import {
  BUGS_CONHECIDOS,
  COMPONENTES_CRITICOS,
  ERROS,
  type Dominio,
  type ErrorDef,
} from "./error-catalog";

// Gera docs/catalogo-erros.md a partir do catálogo (lib/error-catalog.ts).
// Rodar: npx tsx scripts/gerar-catalogo-erros.ts
// O teste test/falhas/catalogo.test.ts falha se o arquivo estiver desatualizado.

const NOMES: Record<Dominio, string> = {
  GERAL:       "Geral (qualquer rota)",
  AUTH:        "Autenticação e sessão",
  USUARIO:     "Cadastro e usuários",
  AGENDA:      "Agendamento",
  CONSULTA:    "Consultas",
  PAGAMENTO:   "Pagamentos e webhook do Asaas",
  CHAT:        "Chat",
  RECEITA:     "Receitas",
  CERTIFICADO: "Certificado digital e assinatura",
  ARQUIVO:     "Arquivos e anexos",
  PESO:        "Peso e IMC",
  ADMIN:       "Administração",
  VIDEO:       "Videochamada",
  FILA:        "Fila on-demand (desligada)",
  REDE:        "Rede e conexão (só no site/app)",
  INFRA:       "Infraestrutura (só no log)",
};

const ORDEM: Dominio[] = [
  "GERAL", "AUTH", "USUARIO", "ADMIN", "AGENDA", "CONSULTA", "PAGAMENTO", "CHAT",
  "RECEITA", "CERTIFICADO", "ARQUIVO", "PESO", "VIDEO", "REDE", "INFRA", "FILA",
];

const SEVERIDADE: Record<ErrorDef["severidade"], string> = {
  info: "info", aviso: "aviso", erro: "erro", critico: "**crítico**",
};

/** Cenários de queda simulados nos testes (test/falhas/*). */
const CENARIOS: { peca: string; simulacao: string; esperado: string; teste: string }[] = [
  { peca: "Banco de dados", simulacao: "Prisma lança PrismaClientInitializationError", esperado: "503 INFRA_BANCO_INDISPONIVEL, sem texto do Prisma", teste: "rotas.test.ts" },
  { peca: "Banco de dados", simulacao: "SELECT 1 do health check falha", esperado: "/api/health responde 503, componente banco = fora", teste: "webhook-health.test.ts" },
  { peca: "Tempo real (NOTIFY)", simulacao: "conexão LISTEN do Postgres recusada", esperado: "publish não lança; log INFRA_REALTIME_FALHOU; próxima chamada tenta de novo", teste: "realtime.test.ts" },
  { peca: "Asaas", simulacao: "rede caiu / timeout / 5xx", esperado: "PAGAMENTO_GATEWAY_INDISPONIVEL (503)", teste: "servicos-externos.test.ts" },
  { peca: "Asaas", simulacao: "chave ausente ou recusada (401)", esperado: "PAGAMENTO_GATEWAY_NAO_CONFIGURADO (503)", teste: "servicos-externos.test.ts" },
  { peca: "Asaas", simulacao: "cartão recusado (400 com descrição)", esperado: "PAGAMENTO_RECUSADO com o motivo do Asaas", teste: "servicos-externos.test.ts" },
  { peca: "Webhook Asaas", simulacao: "PENDING atrasado para pagamento já confirmado", esperado: "pagamento continua pago; log WEBHOOK_REGRESSAO_IGNORADA", teste: "webhook-health.test.ts" },
  { peca: "Resend", simulacao: "sem chave / 500", esperado: "sem chave: só log; 500: AUTH_EMAIL_NAO_ENVIADO", teste: "servicos-externos.test.ts" },
  { peca: "LiveKit", simulacao: "variáveis LIVEKIT_* ausentes", esperado: "503 VIDEO_NAO_CONFIGURADO na rota do token", teste: "rotas.test.ts" },
  { peca: "Chave dos certificados", simulacao: "PFX_ENCRYPTION_KEY ausente, curta ou trocada", esperado: "CERTIFICADO_CHAVE_SERVIDOR (503)", teste: "servicos-externos.test.ts" },
  { peca: "Armazenamento", simulacao: "putObject lança no upload de anexo", esperado: "502 ARQUIVO_ARMAZENAMENTO_FALHOU, sem texto do storage", teste: "rotas.test.ts" },
  { peca: "Armazenamento", simulacao: "anexo acima de 4 MB", esperado: "413 ARQUIVO_MUITO_GRANDE (o site recusa antes de enviar)", teste: "rotas.test.ts" },
  { peca: "Auditoria", simulacao: "gravação do AuditLog falha", esperado: "a ação (encerrar consulta) conclui; log INFRA_AUDITORIA_FALHOU", teste: "rotas.test.ts" },
  { peca: "Webhook Asaas", simulacao: "token errado / token não configurado / banco fora", esperado: "403 WEBHOOK_TOKEN_INVALIDO / 500 / 503 (o Asaas reenvia)", teste: "webhook-health.test.ts" },
  { peca: "Sessão", simulacao: "chamada /api/* sem cookie", esperado: "401 JSON AUTH_SESSAO_EXPIRADA (não mais redirect HTML)", teste: "rotas.test.ts" },
  { peca: "Login", simulacao: "6ª tentativa em 15 min", esperado: "código login_bloqueado → AUTH_LOGIN_BLOQUEADO", teste: "login.test.ts" },
  { peca: "Login", simulacao: "conta desativada (senha certa / senha errada)", esperado: "conta_desativada / \"senha incorreta\" (não revela a conta)", teste: "login.test.ts" },
  { peca: "Permissão", simulacao: "médico tenta agendar como paciente", esperado: "403 AUTH_SEM_PERMISSAO (antes 401, como se a sessão tivesse caído)", teste: "rotas.test.ts" },
  { peca: "Requisição", simulacao: "corpo JSON malformado", esperado: "400 REQUISICAO_JSON_INVALIDO (antes 500)", teste: "rotas.test.ts" },
  { peca: "Requisição", simulacao: "?status= inexistente", esperado: "422 PARAMETRO_INVALIDO (antes 500 do Prisma)", teste: "rotas.test.ts" },
  { peca: "Proteção CSRF", simulacao: "Referer malformado", esperado: "403 ORIGEM_NAO_AUTORIZADA (antes 500)", teste: "classificacao.test.ts" },
  { peca: "Cliente (site)", simulacao: "rede caiu, timeout, HTML no lugar de JSON, 401, 429", esperado: "ApiError com código e mensagem amigável; 401 leva ao login", teste: "lib/api-client.test.ts" },
  { peca: "Cliente (app)", simulacao: "cada DioExceptionType, HTML, 401, TypeError", esperado: "ApiError com código; nunca texto do Dio", teste: "mobile/test/api_error_test.dart" },
];

const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

export function gerarMarkdown(): string {
  const linhas: string[] = [];
  const total = Object.keys(ERROS).length;
  const porDominio = new Map<Dominio, [string, ErrorDef][]>();
  for (const [code, def] of Object.entries(ERROS) as [string, ErrorDef][]) {
    const lista = porDominio.get(def.dominio) ?? [];
    lista.push([code, def]);
    porDominio.set(def.dominio, lista);
  }

  linhas.push(
    "# Catálogo de erros — Emacrescere",
    "",
    "> Arquivo gerado por `npx tsx scripts/gerar-catalogo-erros.ts` a partir de",
    "> `lib/error-catalog.ts`. Não edite à mão: mude o catálogo e gere de novo.",
    "",
    `São ${total} erros catalogados, ${COMPONENTES_CRITICOS.length} peças críticas mapeadas e ${BUGS_CONHECIDOS.length} problemas conhecidos registrados.`,
    "",
    "## Como funciona",
    "",
    "- **Resposta da API.** Todo erro sai no formato `{ \"message\": \"...\", \"code\": \"CODIGO\", \"status\": 409, \"errors\": { campo: [...] } }`. `message` já é o texto para o usuário; `errors` só aparece em erro de formulário.",
    "- **Servidor.** Erro esperado é `throw new AppError(\"CODIGO\")` (`lib/errors.ts`); numa rota, `return apiError(\"CODIGO\")` (`lib/api-response.ts`). Erros do Prisma, JSON inválido e zod são convertidos sozinhos por `toApiError`. Mensagem técnica nunca chega ao usuário em produção.",
    "- **Site.** Chamadas passam por `apiFetch` (`lib/api-client.ts`), que transforma qualquer falha em `ApiError` com código. `mensagemDeErro(err)` dá o texto. 401 leva ao login; falhas de rede seguidas acendem o aviso de conexão (`ConnectionBanner`).",
    "- **App (Flutter).** `ApiError.from(e)` (`mobile/lib/services/api_error.dart`) faz o mesmo com os erros do Dio; 401 em qualquer tela volta ao início com \"Sua sessão expirou\" (`SessionGuard`).",
    "- **Logs.** Erros 5xx e falhas de infraestrutura geram uma linha JSON com `code` (`logError`). Para achar no painel da Vercel, busque pelo código, por exemplo `INFRA_BANCO_INDISPONIVEL`.",
    "- **Saúde do sistema.** `GET /api/health` (público: só o estado geral; administrador: cada peça) e o card \"Saúde do sistema\" no painel do administrador.",
    "- **Adicionar um erro.** Crie a entrada em `lib/error-catalog.ts`, use o código e rode o gerador. O teste `test/falhas/catalogo.test.ts` reprova código usado e não catalogado, e documento desatualizado.",
    "",
    "Colunas: **HTTP** 0 = erro que só existe no site/app (nunca vem da API); 200 = aviso que acompanha uma resposta de sucesso.",
    "",
  );

  linhas.push("## Resumo por área", "", "| Área | Erros |", "|---|---|");
  for (const d of ORDEM) {
    const n = porDominio.get(d)?.length ?? 0;
    if (n) linhas.push(`| ${NOMES[d]} | ${n} |`);
  }
  linhas.push("");

  linhas.push("## Erros por área", "");
  for (const d of ORDEM) {
    const lista = porDominio.get(d);
    if (!lista?.length) continue;
    linhas.push(
      `### ${NOMES[d]}`,
      "",
      "| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |",
      "|---|---|---|---|---|---|---|---|",
    );
    for (const [code, def] of lista) {
      linhas.push(
        `| \`${code}\` | ${def.status} | ${SEVERIDADE[def.severidade]} | ${esc(def.mensagem || "— (não aparece na tela)")} | ${esc(def.acao)} | ${esc(def.reacao)} | ${esc(def.causa)} | ${def.tentarNovamente ? "sim" : "não"} |`,
      );
    }
    linhas.push("");
  }

  linhas.push(
    "## Peças críticas: o que acontece quando uma para",
    "",
    "| Peça | Papel | Sintoma | Códigos | Reação | Como detectar |",
    "|---|---|---|---|---|---|",
  );
  for (const c of COMPONENTES_CRITICOS) {
    linhas.push(
      `| ${esc(c.nome)} | ${esc(c.papel)} | ${esc(c.sintoma)} | ${c.codigos.map((x) => `\`${x}\``).join(", ")} | ${esc(c.reacao)} | ${esc(c.detectar)} |`,
    );
  }
  linhas.push("");

  linhas.push(
    "## Testes de falha",
    "",
    "Cada cenário simula a peça parando (tudo com mocks: nenhum teste toca o banco real). Rodar com `npx vitest run test/falhas lib/api-client.test.ts`; o do app com `cd mobile && flutter test`.",
    "",
    "| Peça | Simulação | Reação esperada | Teste |",
    "|---|---|---|---|",
  );
  for (const c of CENARIOS) {
    linhas.push(`| ${esc(c.peca)} | ${esc(c.simulacao)} | ${esc(c.esperado)} | \`${c.teste}\` |`);
  }
  linhas.push("");

  linhas.push(
    "## Problemas conhecidos (registrados, ainda não corrigidos)",
    "",
    "Ficaram de fora por exigirem mudança de schema (que vai para o banco de produção no deploy) ou de regra de negócio. Correção sugerida em cada um.",
    "",
    "| Problema | Impacto | Causa | Correção sugerida |",
    "|---|---|---|---|",
  );
  for (const b of BUGS_CONHECIDOS) {
    linhas.push(`| ${esc(b.titulo)} | ${esc(b.impacto)} | ${esc(b.causa)} | ${esc(b.correcao)} |`);
  }
  linhas.push("");

  return linhas.join("\n");
}
