# Emacrescere — pacote de planejamento para o Claude Code

Documento de handoff das próximas implementações. Foi escrito a partir de uma análise do código feita em 13–14/10/2026 numa **cópia do repositório** (sem rodar nada). **Status (15/10/2026): P0, P1 (regra D2 abaixo), QR no PDF e medidas mínimas implementados na branch `pacotes-out26`; o resto é trabalho futuro (ver `PROJETO-STATUS.md`).** Caminhos de arquivo e comportamentos descritos devem ser **conferidos no código atual da `main`** antes de confiar neles: o Claude Code é quem tem o repositório de verdade.

Versão completa e comentável (com roadmap desenhado): https://claude.ai/code/artifact/3d837e7f-0ec3-4b97-ba01-dacae3e51504

---

## 1. Como usar (Hugo e Julia)

1. Crie uma **branch de trabalho** (não a `main`) e salve este arquivo como `docs/planejamento-novas-implementacoes.md`.
2. Abra o Claude Code na raiz do repositório e cole o **Prompt de abertura** (seção 2).
3. Trabalhe **um pacote por vez**: cole o prompt do pacote (seções 7 a 12). O Claude Code responde com um **plano**; você aprova (ou corrige); só então ele implementa.
4. Preencha as **decisões** (seção 5) antes dos pacotes P3, P4 e P5. P0, P1 e P2 podem começar com as recomendações.
5. Revisem o diff. **Quem faz merge na `main` é o Hugo.** Se o pacote mexe no site, o merge dele vai por último.

Ordem recomendada: P0 → (P1, P2) → (P3, P4) → refinos → P5.

---

## 2. Prompt de abertura (colar primeiro)

```text
Vou te passar, um pacote por vez, as próximas implementações do Emacrescere.
Antes de qualquer coisa, NÃO altere nenhum arquivo. Leia: CLAUDE.md, mobile/CLAUDE.md,
mobile/HANDOFF.md, PROJETO-STATUS.md, README.md e docs/planejamento-novas-implementacoes.md.
Depois responda, em no máximo 12 linhas: (1) as regras que você não pode quebrar,
(2) o que você entendeu de cada pacote P0 a P5, (3) qualquer ponto do documento que
discorda do código atual. Depois espere eu pedir um pacote.
```

---

## 3. Regras fixas (valem para TODO pacote)

- **O banco é único e é o de produção.** Nunca rodar `npm run build` na máquina (o build faz `prisma db push` e o seed no banco real). Nunca `prisma db push --accept-data-loss`. Mudanças de schema **somente aditivas** (tabela nova, coluna opcional, valor novo). Lembrar que o merge na `main` roda o build na Vercel, então o schema entra em produção no merge.
- Teste que grava dado precisa desfazer o que gravou.
- Nunca `git push --force` nem `git reset --hard`. Nenhum `.env*` no histórico. Se o Git pedir login, **pare e avise**.
- **Merge na `main` publica o site e é decisão do Hugo.** O Claude Code trabalha em branch própria. Para gerar prévia na Vercel, usar `[preview]` na mensagem do último commit; **não** usar `[build]` em branch.
- A Vercel olha só o último commit do push. Variável nova no painel da Vercel só vale no próximo deploy.
- Antes de enviar: `tsc` sem passar de 60 erros (dívida antiga), testes verdes, lint nos arquivos alterados.
- **Site e app concordam.** Contratos de API e flags (`QUEUE_ENABLED` / `kQueueEnabled`) precisam ser iguais nos dois lados. Regras de cálculo ficam **só no servidor** (como o IMC em `lib/bmi.ts`): o app mostra, não recalcula.
- Datas para o backend sempre em UTC. Toda mutação passa por `checkOrigin`, validação (zod), rate limit e, quando sensível, `AuditLog`.
- **Regras de produto que não podem ser quebradas:** a plataforma não vende, não indica e não entrega medicamento; não existem farmácias parceiras; nada promete resultado; textos só afirmam o que o sistema faz; sem números ou depoimentos inventados. Hoje o atendimento é só por consulta agendada (a fila está desligada por flag).
- Sessões na nuvem **não rodam Flutter**. `flutter analyze`, `flutter test` e abrir o app só na máquina do Hugo ou da Julia. Se o pacote mexe no app, o Claude Code deve listar o que precisa ser testado lá.
- Atualizar `CLAUDE.md`, `PROJETO-STATUS.md` e os handoffs do app **no mesmo pacote** quando uma regra ou arquivo mudar.

---

## 4. Contexto mínimo do projeto

- Plataforma de telemedicina para acompanhamento de obesidade e emagrecimento. Site Next.js 14 (TypeScript, Prisma, Neon Postgres, NextAuth v5, Asaas em sandbox, LiveKit, Resend) e app Flutter em `mobile/`.
- Papéis: PATIENT, DOCTOR, ADMIN, SUPER_ADMIN. Consulta: SCHEDULED → (WAITING) → IN_PROGRESS → COMPLETED, ou CANCELLED / NO_SHOW. Só o médico da consulta muda o status; para chamar ou iniciar uma consulta agendada o pagamento precisa estar RECEIVED ou CONFIRMED.
- Receita emitida na plataforma, PDF assinado (PKCS#7) com o certificado do médico, validação pública em `/prescricao/[id]`.
- Contas de demonstração (senha `Demo@12345`): pacientes `mariana.castro@email.com`, `patricia.nunes@email.com`; médicos `fernanda.costa@demo.emacrescere.app`, `ricardo.alves@demo.emacrescere.app`. O Claude Code **não deve fazer login em produção** com essas contas.
- Banca do TCC: **03/11/2026**. Congelamento de funcionalidades sugerido para 20/10.

---

## 5. Decisões do grupo (preencher antes de pedir os pacotes)

| # | Decisão | Recomendação | Resposta do grupo |
|---|---|---|---|
| D1 | Implementar algo antes da banca ou tratar tudo como trabalhos futuros no TCC? | Só o chat de 24 h (P1), se houver tempo; o resto como trabalhos futuros |  Pacote leve antes da banca: P0, P1 (regra abaixo), QR no PDF e medidas do corpo (só site). O resto vira trabalho futuro. |
| D2 | Chat: durante as 24 h, leitura e envio liberados? Canceladas e faltas sem chat? Depois do prazo, bloquear ou apagar? | Leitura e envio por 24 h após `endedAt`; canceladas e faltas sem chat; só bloquear |  Envio liberado por 24 h após o fim (COMPLETED); leitura do histórico sempre liberada; canceladas, faltas e não iniciadas sem envio. |
| D3 | Filas: desfazer a decisão de "só consulta agendada"? Ou primeiro ampliar o agendamento por tipo (P5a), sem fila? | Fazer P5a primeiro; fila (P5b) só depois |  Sem fila e sem P5 antes da banca (trabalho futuro). |
| D4 | O que a nutricionista entrega sem receita? CRN com verificação simulada como o CRM? | Consulta e orientação, sem receita nem certificado; CRN simulado |  — (P5 adiado) |
| D5 | Preço e repasse por tipo de profissional (hoje R$ 150 fixos; repasse 60% no TCC, 70% no código) | Mapa por tipo; alinhar o repasse a 60% |  — (P5 adiado) |
| D6 | Medidas: aprovar o conjunto inicial e as regras de segurança | Cintura (e cintura/estatura), pressão arterial, sintomas, composição corporal pelo médico; sem metas agressivas, sem sequências, sem lembretes de registro |  Onda mínima: cintura, quadril, gordura corporal (%) e massa magra (kg), com RCEst e RCQ calculados no servidor. Sem pressão arterial, sintomas e fórmulas de estimativa. Sem metas, sequências ou lembretes. |
| D7 | Suporte: quem aprova? Prazo, limite e duração máxima? O médico recebe na reposição? | ADMIN no começo; prazo 7 dias, até 1 reposição por consulta e 2 por paciente em 90 dias, duração menor que 15 min e sem receita; crédito válido por 30 dias |  — (P3 adiado) |
| D8 | Farmácia: só nível 1? Quem consulta advogado e farmacêutico antes do nível 2? | Só nível 1 agora |  Só QR para a página de validação que já existe (sem token novo). |
| D9 | Validade da receita de GLP-1 (180 dias no sistema; a página da Anvisa consultada fala em 90 dias e duas vias) | Confirmar com o médico responsável antes de mudar |  Pendente: não mexer até confirmação do médico responsável. |

Os valores sugeridos em D7 são pontos de partida, não regras validadas. Devem ficar em constantes configuráveis.

---

## 6. Achados da análise (conferir no código antes de usar)

- **Chat:** existem duas pilhas com regras diferentes. A: `services/api/chat.ts` + `app/api/chat/[roomToken]/*` (usada pelo app e por `components/chat/ChatWindow.tsx`; enviar em IN_PROGRESS ou WAITING; ler em qualquer status). B: `app/api/consultations/[id]/messages` + `components/consulta/ChatPanel.tsx` (enviar só em IN_PROGRESS; ler em qualquer status). `getConsultationById` devolve todas as mensagens em `GET /api/consultations/[id]`. `markMessagesAsRead` parece não checar participante (conferir a rota). `endedAt` só é gravado em alguns caminhos. O app consulta o chat a cada 5 s e engole erros; a lista de conversas do app abre chats de consultas passadas. Não há testes de chat.
- **Fila:** global (qualquer médico aprovado vê tudo); preço fixo `CONSULTATION_FEE_REAIS = 150`; expiração só roda quando um médico lista a fila (não há cron); o usuário paga antes de entrar; não há política de estorno para fila. Telas do app preservadas atrás de `kQueueEnabled`.
- **Profissional:** `DoctorProfile.specialty` é texto livre; `crm` é obrigatório e `@unique`; verificação de CRM simulada em `services/external/cfm.ts`; cerca de 67 ocorrências de `"DOCTOR"` em 42 arquivos. Receita e certificado são amarrados ao papel DOCTOR.
- **Peso:** `WeightRecord`; IMC calculado na leitura (`lib/bmi.ts`). Cerca de 15 pontos mudam por medida nova se forem colunas em `WeightRecord`.
- **Pagamento:** `Payment.consultationId` é `@unique` (um pagamento por consulta); `amount` obrigatório; `refundPayment` exige `asaasPaymentId`; o gate de pagamento está em `updateConsultationStatus` (`services/api/consultation.ts`); `DOCTOR_REVENUE_PCT` é só um número exibido; **não há controle de repasse**.
- **Vídeo:** não há webhook do LiveKit nem registro de conexão. Se o médico fecha a aba, a consulta fica IN_PROGRESS para sempre (sem cron). `markNoShow` exige 3 min desde `claimedAt` e puniria o paciente numa queda do médico.
- **Suporte:** só existe `mailto`. Não há papel de suporte nem tickets.
- **Receita:** o PDF só imprime o endereço de validação (sem QR); o download do PDF assinado exige login; `/prescricao/[id]` usa o próprio id como chave; não há estado "dispensada". `GLP1` está mapeado para tipo COMUM com 180 dias.
- **Textos inconsistentes:** os Termos (`app/termos/page.tsx`, seções 5 e 8) falam em "farmácias parceiras", contra a regra do produto; `CLAUDE.md` diz que não se promete ICP-Brasil, enquanto a Resolução CFM 2.299/2021 exige ICP-Brasil na receita digital; docs do app chamam o ADMIN de "farmácia".

---

## 7. P0 — Alinhar textos e regras (Fase 0)

**Objetivo.** Corrigir inconsistências que já existem, antes de acrescentar funcionalidade. Só texto e docs; nenhuma mudança de lógica, **exceto** a validade do GLP-1 se (e somente se) a D9 estiver confirmada.

**Escopo.**
- Termos de uso (seções 5 e 8): remover ou reescrever "farmácias parceiras" de acordo com a regra do produto.
- Landing e páginas que afirmam "sem farmácia parceira" (`Faq`, `Footer`, `Hero`, `HowItWorks`, `app/dashboard/patient/page.tsx`, `app/prescricao/[id]/page.tsx`): conferir se estão coerentes entre si e com os Termos. Não inventar promessa nova.
- Docs do app: onde o ADMIN é chamado de "farmácia" (`mobile/HANDOFF.md`, `mobile/CLAUDE.md`), corrigir.
- `CLAUDE.md`: registrar a limitação "certificado de teste, sem validade jurídica; o CFM exige ICP-Brasil" em vez de só dizer que não se promete. **Não** afirmar que o sistema cumpre a norma.
- GLP-1: só mexer em `CLASS_TO_TYPE` / `calculateExpiry` com D9 confirmada, incluindo número de vias.

**Testes.** Teste da validade por tipo de receita (se D9 mudar algo).

**Critérios de aceite.** Nenhum texto do repositório contradiz a regra "não vende, não indica, sem farmácias parceiras"; `grep` por "parceir" não deixa ocorrência incoerente; `tsc`, testes e lint verdes.

**Prompt (colar no Claude Code):**

```text
Pacote P0 (alinhar textos). MODO PLANO: não altere nada ainda.
Leia a seção 7 e a seção 6 de docs/planejamento-novas-implementacoes.md e confira no código atual:
(1) onde os textos falam em "farmácia parceira" ou "farmácias parceiras", (2) onde o ADMIN é
chamado de "farmácia", (3) onde CLAUDE.md fala de ICP-Brasil, (4) onde estão CLASS_TO_TYPE e
calculateExpiry. Devolva: lista de arquivos e trechos a mudar, o texto novo proposto para cada um,
e o que depende da decisão D9 (GLP-1), que ainda NÃO mude. Espere meu ok para implementar.
Regras fixas da seção 3 valem.
```

---

## 8. P1 — Chat expira 24 h após a consulta (Fase 1)

**Objetivo.** O chat (site e app) deixa de aceitar leitura e envio 24 horas depois do encerramento da consulta. Mensagens são **bloqueadas, não apagadas**.

**Regra de negócio (recomendação, ver D2).**
- IN_PROGRESS (e WAITING, se a fila voltar): chat aberto.
- COMPLETED: aberto até `endedAt + 24 h` (leitura e envio).
- CANCELLED e NO_SHOW: sem chat.
- Referência do prazo: `endedAt`; se nulo, `updatedAt`.
- O chat não alimenta o prontuário (o registro clínico está nos campos da consulta e na receita), então só bloquear é seguro e reversível. Apagar de verdade exigiria job agendado (o projeto não tem cron) e uma decisão sobre retenção.

**Implementação.**
- Função pura central, por exemplo `lib/chat-access.ts`: `getChatAccess({ status, endedAt, updatedAt }, now)` devolvendo `{ canRead, canSend, expiresAt, reason }`. Toda checagem passa por ela.
- Aplicar nas **duas** pilhas (A e B), na marcação de lido, no stream SSE (fechar a conexão ao expirar), no SSE `app/api/realtime/consultation/[id]` e em `getConsultationById` (não devolver mensagens fora do prazo).
- Resposta de servidor clara e documentada para chat expirado (sugestão: 410 com `{ message, code: "CHAT_EXPIRED" }`), para o app antigo e o novo tratarem.
- Site: `ChatPanel`, `ConsultationRoom`, `useChat`, `ChatWindow`, página de chat do médico no dashboard (hoje sem a regra que a do paciente tem): mostrar "chat encerrado", parar o polling.
- App: `chat_screen.dart` (parar o timer e desabilitar o composer ao receber o código de expirado), `chat_tab_screen.dart` (ocultar ou marcar como encerradas as passadas), e as telas que embutem o chat (`consultation_detail_screen.dart`, `room/consultation_room_screen.dart`, `doctor/doctor_room_screen.dart`).

**Fora do escopo.** Apagar mensagens; mudar prontuário; notificações novas.

**Testes.** Vitest em tabela para `getChatAccess` (cada status, antes e depois das 24 h, `endedAt` nulo, fuso); teste do app para o composer desabilitado.

**Critérios de aceite.** Depois de 24 h do encerramento, nenhuma rota devolve nem aceita mensagem, em nenhuma das duas pilhas; o app mostra estado "encerrado" sem ficar girando; nenhuma rota vaza mensagens fora do prazo.

**Prompt (colar no Claude Code):**

```text
Pacote P1 (chat expira 24 h). MODO PLANO: não altere nada ainda.
Leia a seção 8 de docs/planejamento-novas-implementacoes.md. Confira no código atual todas as
rotas, serviços, componentes e telas do app que leem ou enviam mensagem (existem duas pilhas de
chat e um GET /api/consultations/[id] que devolve mensagens). Devolva: (1) o desenho da função
getChatAccess, (2) a lista completa de pontos a alterar no site e no app, (3) o código de resposta
para chat expirado e como o app antigo se comporta, (4) os testes, (5) riscos e dúvidas, incluindo
as decisões de D2 que ainda faltam. Espere meu ok. Depois de aprovado: implemente em branch própria,
com [preview] no último commit, e liste o que a Julia precisa testar no app (você não roda Flutter).
```

---

## 9. P2 — Medidas ampliadas do paciente (Fase 1, onda 1)

**Objetivo.** Ampliar o acompanhamento além de peso e IMC, para dar mais base à decisão do médico e ao paciente, sem prejudicar o peso e IMC que já funcionam.

**Modelagem (recomendada).** Nova tabela `BodyMeasurement`, sem tocar `WeightRecord`:
- Campos sugeridos: `id`, `patientId`, `type` (String validada por registro em código), `value`, `value2` (opcional, para pressão arterial), `measuredAt`, `note`, `source` (PATIENT ou DOCTOR), `recordedById`, `consultationId` (opcional). Índice em `[patientId, type, measuredAt]`.
- Registro em código `lib/measures.ts`: por tipo, unidade, mínimo, máximo e quem pode registrar. Tipo como texto, **sem enum**, para não alterar enum no banco único.
- Relações derivadas (por exemplo cintura/estatura) **calculadas só no servidor**, a partir da altura em `PatientProfile`.
- Rota `/api/measurements` (GET, POST, DELETE) reaproveitando `assertCanAccess` de `services/api/weight.ts`, `AuditLog` (novas ações) e rate limit.
- Tela genérica "série + tabela + gráfico" que serve a todas as medidas, ao lado de `WeightPanel`; aba na sala da consulta; app: modelo, serviço, tela de acompanhamento e a visão do médico.

**Onda 1 (conjunto inicial, ver D6).**

| Medida | Quem registra | Observação |
|---|---|---|
| Cintura (cm) e cintura/estatura (calculada) | Paciente ou médico | Tela com instrução de como medir |
| Pressão arterial (sistólica e diastólica) | Paciente ou médico | Instrução de medição; valores muito altos pedem aviso genérico para procurar o médico (o limiar e o texto precisam de validação do médico responsável) |
| Sintomas e efeitos colaterais | Paciente | Intensidade e descrição curta |
| Gordura corporal (%) e massa magra (kg) | Médico, na consulta | Sem fórmulas de estimativa (CUN-BAE, Deurenberg) |

**Segunda onda (depois):** quadril e cintura/quadril, adesão, atividade e sono, glicemia e HbA1c informadas pelo médico. Fotos de evolução por último (exigem armazenamento de arquivos, hoje sem S3, consentimento e LGPD).

**Regras de segurança do paciente (obrigatórias).** Sem metas agressivas de cintura ou gordura; sem sequências de dias; sem lembretes do tipo "você não registrou"; mostrar tendência, não só o último número; aviso com caminho para falar com o médico. O cadastro não tem triagem de risco de transtorno alimentar: não inventar uma.

**Fora do escopo.** Fotos; integrações com balanças; qualquer cálculo no app.

**Testes.** Limites e unidades do registro; cálculos derivados; autorização (paciente só vê o dele; médico só dos seus pacientes); teste do app.

**Critérios de aceite.** Peso e IMC continuam exatamente como estão; uma medida nova se adiciona só no registro em código mais ajustes de tela; app e site mostram os mesmos valores.

**Prompt (colar no Claude Code):**

```text
Pacote P2 (medidas ampliadas, onda 1). MODO PLANO: não altere nada ainda.
Leia a seção 9 de docs/planejamento-novas-implementacoes.md e mobile/CLAUDE.md (regra: o app não
recalcula IMC). Confira o código atual de peso e IMC no site e no app. Devolva: (1) o schema
aditivo proposto para BodyMeasurement com o comando seguro para aplicá-lo (lembrando que o banco é
único e de produção), (2) o conteúdo do registro lib/measures.ts, (3) as rotas, (4) a lista de
arquivos do site e do app, (5) os testes, (6) as regras de segurança do paciente e onde cada uma
será aplicada, (7) dúvidas. Espere meu ok. Aprovado: implemente primeiro só a infraestrutura mais
UMA medida (cintura), para validarmos o padrão, e pare para eu revisar antes das demais.
```

---

## 10. P3 — Suporte e reposição de consulta sem novo pagamento (Fase 2)

**Objetivo.** Quando uma consulta é interrompida por queda de luz ou internet (do médico ou do paciente), o paciente abre um chamado, o suporte avalia e, se aprovar, o paciente remarca **sem pagar de novo**.

**Princípio de desenho.** Não mexer no gate de pagamento de `updateConsultationStatus`. A reposição é uma consulta nova com um `Payment` de **valor zero**, status RECEIVED, marcado com origem de reposição, ligado ao chamado.

**Modelo (aditivo).**
- `SupportTicket`: `patientId`, `consultationId`, `status` (OPEN, IN_REVIEW, NEED_INFO, APPROVED, REJECTED, REPLACEMENT_SCHEDULED, CLOSED), `reason` (DOCTOR_CONNECTION, PATIENT_CONNECTION, PLATFORM_FAILURE, OTHER), `description`, `evidence` (JSON: cópia das evidências no momento), `decidedById`, `decidedAt`, `decisionNote`, `replacementConsultationId` (único), `replacementDeadline`.
- `SupportTicketMessage` (com campo `internal` para notas que o paciente não vê) e anexos reaproveitando `StoredFile`.
- `Consultation.replacesConsultationId` opcional e único; origem no `Payment` (por exemplo novo valor de método ou campo `origin`).

**Fluxo.**
1. Paciente abre o chamado a partir da consulta (paga, encerrada ou IN_PROGRESS órfã, sem reposição anterior).
2. O servidor guarda as evidências: início, fim, duração, último aviso de presença do paciente, quantidade e horário das mensagens, se houve prontuário ou receita.
3. O suporte aprova ou rejeita, com nota obrigatória; pode pedir informações.
4. Aprovado = **crédito** com prazo, não consulta marcada.
5. O paciente agenda pelo fluxo normal (`?ticket=`); uma função `grantReplacement` valida o chamado e cria, numa só transação, a consulta e o pagamento de valor zero.
6. Toda ação grava `AuditLog` (novas `AuditAction`).

**Anti-abuso.** Parâmetros em constantes configuráveis (valores iniciais na D7): prazo para abrir, limite por consulta e por paciente, duração máxima para valer, ausência de receita, prazo do crédito. Quem aprova não pode ser quem pediu. Rate limit e `checkOrigin`.

**Pontos que quebram se não forem tratados (verificar no código).**
- `refundPayment` exige `asaasPaymentId`; cancelar uma reposição hoje falharia. Cancelar reposição deve **devolver o crédito**, sem estorno. `initiatePayment` e `refundPayment` devem rejeitar pagamentos de reposição.
- Totais de receita somam pagamentos RECEIVED (`app/dashboard/admin/page.tsx`, `app/api/admin/payments`, `app/api/admin/stats`, `app/dashboard/doctor/page.tsx`): filtrar por origem.
- `Payment.consultationId` é único: nunca reutilizar o pagamento da consulta original.
- Repasse ao médico: **não há controle**; mesmo médico na reposição faz a segunda consulta sem receber de novo; outro médico exige ajuste manual. Decisão de negócio na D7, sem implementar ledger agora.

**Papel e privacidade.** No começo, o ADMIN atua como suporte. Criar o papel SUPPORT exige ajustes em middleware, menus e rotas que listam papéis (só se decidido). O suporte vê **metadados da consulta, não o prontuário**. Retenção das evidências a definir.

**Telas.** Site (paciente): botão "Tive um problema" no detalhe da consulta e lista de chamados com conversa. Site (admin): lista e decisão com evidências. App: tela de chamado ligada ao detalhe da consulta (versão completa).

**Versão mínima (P3a, esforço médio):** tabelas, rotas, telas do site (paciente e admin), ADMIN decide, `Payment` zerado, trilha de auditoria. **Sem** app, **sem** papel novo, **sem** detecção automática.

**Versão completa (P3b, depois):** webhook do LiveKit (`app/api/webhooks/livekit/route.ts`, rota pública no `middleware.ts`) com tabela de eventos de presença; encerramento automático de consulta IN_PROGRESS órfã; tela no app; notificações por e-mail.

**Fora do escopo.** Controle financeiro de repasse; reembolso em dinheiro (continua a política de cancelamento atual).

**Testes.** Regras anti-abuso; `grantReplacement` (idempotente, transação, unicidade); gate de pagamento aceitando a reposição; cancelamento da reposição sem estorno; filtros de receita.

**Critérios de aceite.** Uma reposição aprovada gera consulta que o médico consegue chamar e iniciar sem pagamento novo; nenhuma reposição aparece como receita; cancelar não tenta estorno; todas as ações têm trilha de auditoria.

**Prompt (colar no Claude Code):**

```text
Pacote P3a (suporte e reposição, versão mínima). MODO PLANO: não altere nada ainda.
Pré-requisito: a decisão D7 da seção 5 do documento de planejamento precisa estar respondida;
se não estiver, liste as perguntas e pare. Leia a seção 10 e confira no código atual:
services/api/payment.ts, services/api/consultation.ts (updateConsultationStatus e cancelamento),
lib/scheduling.ts, prisma/schema.prisma (Payment, Consultation), as rotas e telas de admin e os
totais de receita. Devolva: (1) o schema aditivo exato, (2) o desenho de grantReplacement e
da transação, (3) como o gate de pagamento aceita o valor zero sem mudar sua regra, (4) todos os
lugares que somam receita ou chamam estorno, (5) rotas e telas, (6) testes, (7) riscos financeiros
e de privacidade. Espere meu ok. Aprovado: implemente em branch própria, [preview] no último commit.
```

---

## 11. P4 — Farmácia, nível 1: QR e link com token na receita (Fase 2)

**Objetivo.** Qualquer farmácia consegue ver e conferir a receita assinada por um QR code, sem login, com acesso por token. **Sem lista, sugestão ou vínculo com farmácia**, sem comissão.

**Por que só o nível 1.** Os níveis 3 e 4 (portal da farmácia com cotação, marketplace) esbarram em regras do CFM (Resolução 2.299/2021, art. 11: vedado direcionar prescrições a farmácias específicas; Código de Ética Médica, arts. 68 e 69) e mudariam o posicionamento do projeto. O nível 2 (paciente escolhe a farmácia e envia, com consentimento) só depois de validar com advogado e farmacêutico (D8). Este pacote **não implementa** níveis 2 a 4.

**Escopo.**
- Token de acesso próprio na receita (aleatório, não adivinhável), separado do id, em coluna nova aditiva. Receitas antigas: gerar token sob demanda ou na emissão seguinte.
- QR code impresso no PDF apontando para a página por token, **antes de assinar** (a assinatura cobre o conteúdo). Exige biblioteca de QR: avaliar tamanho, licença e compatibilidade com o ambiente da Vercel antes de adicionar.
- Página pública por token com os dados já mascarados que `/prescricao/[id]` mostra; download do PDF assinado por token, com expiração acompanhando a validade da receita e rate limit.
- Textos: "qualquer farmácia pode conferir a receita pelo QR". Não prometer dispensação, preço ou entrega.

**Fora do escopo.** Estado "dispensada" e uso único (exigem identidade da farmácia); cadastro de farmácia; qualquer cotação.

**Privacidade.** O link dá acesso a dado de saúde a quem o tiver; o controle é do paciente, que detém o PDF. Mascarar dados do paciente; não indexar (noindex); registrar acessos se for simples.

**Testes.** Geração e expiração do token; rate limit; PDF continua assinando e validando com o QR; páginas antigas por id continuam funcionando.

**Critérios de aceite.** Um PDF novo traz QR; o QR abre a receita sem login; o token expira; a validação pública atual segue funcionando.

**Prompt (colar no Claude Code):**

```text
Pacote P4 (farmácia nível 1: QR e token). MODO PLANO: não altere nada ainda.
Pré-requisitos: P0 concluído e D8 respondida. Leia a seção 11 e confira o código atual de receita:
prisma/schema.prisma (Prescription), lib/prescription-pdf.ts, lib/sign-pdf.ts, services/api/prescription.ts,
app/prescricao/[id], app/api/prescription/validate, app/api/prescriptions/[id]/pdf. Devolva:
(1) o schema aditivo, (2) como o QR entra no PDF antes da assinatura e qual biblioteca você
recomenda (tamanho, licença, compatibilidade com a Vercel), (3) a rota e a página por token,
(4) como o token expira, (5) o que muda para receitas já emitidas, (6) testes, (7) riscos de
privacidade (LGPD). NÃO proponha lista de farmácias, cotação, comissão ou qualquer vínculo.
Espere meu ok.
```

---

## 12. P5 — Três filas: endocrinologista, médico e nutricionista (Fase 4)

**Atenção.** É a ideia mais cara e a **única que desfaz uma decisão de produto**: o grupo descartou a fila, `CLAUDE.md` proíbe qualquer menção a ela e o TCC (seção 5.5.1) a trata como trabalho futuro. **Não começar sem as decisões D3, D4 e D5.** Esforço grande.

**Dois passos (recomendado).**
- **P5a — tipo de profissional no agendamento (sem fila).** Enum aditivo `ProfessionalType` (ENDOCRINOLOGIST, GENERAL_PRACTITIONER, NUTRITIONIST) em `DoctorProfile`, com padrão GENERAL_PRACTITIONER; cadastro e aprovação por tipo; filtro por tipo no catálogo do agendamento; os médicos de demonstração recebem o tipo certo (seed); nutricionista bloqueada de receita e certificado. Amplia o raio de atendimento **sem reativar a fila** e sem contradizer a regra "só consulta agendada".
- **P5b — fila por tipo.** Só depois e só se D3 decidir desfazer a regra.

**P5a — escopo.**
- Schema aditivo: `ProfessionalType` com padrão; manter o papel DOCTOR (não criar papel novo: obrigaria revisar cerca de 67 ocorrências em 42 arquivos).
- Registro profissional: hoje `crm` é obrigatório e único; nutricionista tem CRN. Decidir entre campo novo (`registrationBody` + número) e prefixo, **sem remover** o `@unique` antigo; `verifyCrn` simulado em `services/external/cfm.ts` (D4).
- Receita e certificado: bloquear para NUTRITIONIST nos pontos `app/api/consultations/[id]/prescription/route.ts`, `services/api/prescription.ts`, `services/api/certificate.ts`, `lib/prescription-pdf.ts`, e esconder os botões na sala. Um plano alimentar seria documento novo, fora deste pacote.
- Preço e repasse: mapa por tipo em `lib/constants.ts` no lugar do honorário único; `DOCTOR_REVENUE_PCT` como mapa se o repasse variar (D5).
- Telas de cadastro e aprovação (site e app), filtro no agendamento, perfil do profissional.

**P5b — escopo.**
- `Consultation.queueType` opcional; posição, claim, heartbeat e canal de tempo real por tipo (`queue:<tipo>`); no máximo uma consulta ativa por tipo por paciente (hoje uma só).
- Política de estorno quando o paciente paga e nenhum profissional daquele tipo atende (hoje não existe para fila).
- Expiração: a limpeza hoje só roda quando um médico lista a fila; decidir se entra uma checagem oportunista ou tarefa agendada.
- Ligar `QUEUE_ENABLED` e `kQueueEnabled` juntos, revisar todos os textos que dizem "só consulta agendada" (`CLAUDE.md`, `README.md`, `PROJETO-STATUS.md`, handoffs do app, landing, Termos, `docs/roteiro-demonstracao.md`) e a seção 5.5.1 do TCC.

**Riscos.** Qualquer médico atenderia qualquer paciente sem filtro por tipo; nutricionista emitindo receita; flag diferente no site e no app; paciente pagar e ficar sem atendimento.

**Testes.** Fila por tipo; claim só do mesmo tipo; bloqueio de receita para nutricionista; preço por tipo; testes de telas de fila do app (`queue_screens_test`).

**Critérios de aceite (P5a).** Paciente agenda nutricionista e endocrinologista pelo fluxo atual; nutricionista não emite receita nem certificado; nada de fila aparece em nenhuma tela.

**Prompt (colar no Claude Code):**

```text
Pacote P5a (tipo de profissional no agendamento, sem fila). MODO PLANO: não altere nada ainda.
Pré-requisitos: decisões D3, D4 e D5 respondidas na seção 5. Se alguma estiver em branco, liste as
perguntas e pare. Leia a seção 12 e confira no código atual: prisma/schema.prisma (DoctorProfile,
Role), lib/validations/auth.ts, services/api/user.ts (registerDoctor, listDoctors,
decideDoctorApproval), services/external/cfm.ts, o fluxo de agendamento (ScheduleWizard) e os
pontos de receita e certificado. Devolva: (1) o schema aditivo, (2) a estratégia de registro
profissional (CRM x CRN) sem quebrar o @unique de crm, (3) todos os pontos que bloqueiam
receita e certificado para nutricionista, (4) as alterações de preço e repasse por tipo, (5) as
telas do site e do app, (6) o ajuste do seed dos médicos de demonstração, (7) testes e riscos.
NÃO reative a fila nem mexa em QUEUE_ENABLED. Espere meu ok.
```

---

## 13. Checklist de entrega de qualquer pacote

- [ ] Branch própria, nada na `main`; último commit com `[preview]` se quiser prévia.
- [ ] Schema só aditivo; nenhum `npm run build` local; nenhum login de produção.
- [ ] `tsc` (máx. 60 erros), testes verdes, lint nos arquivos alterados.
- [ ] Site e app com o mesmo contrato; nenhum cálculo novo no app.
- [ ] `CLAUDE.md`, `PROJETO-STATUS.md` e handoffs do app atualizados.
- [ ] Lista do que a Julia ou o Hugo precisam testar à mão (Flutter e telas).
- [ ] Resumo final: arquivos alterados, como testar, riscos restantes.
