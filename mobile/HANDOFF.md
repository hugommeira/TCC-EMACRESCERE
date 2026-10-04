# Emacrescere — contexto do projeto (atualizado em 2026-10-03)

> Resumo vivo do projeto pra quem (pessoa ou Claude) chegar sem contexto: o que é, onde
> está cada coisa, o que funciona, o que falta e o histórico das sessões de trabalho.
> Detalhes finos ficam no CLAUDE.md (app) e no README/PROJETO-STATUS.md (site).

## O que é o projeto

**Emacrescere** — TCC (Escola Técnica Pandiá Calógeras, Técnico de Informática, Equipe 6,
aluno responsável Hugo Meira Maia). Plataforma de telemedicina *on-demand* pra
acompanhamento de tratamento de emagrecimento: paciente entra numa fila ou agenda com um
médico específico, paga (Pix/cartão/boleto via Asaas), conversa por chat/vídeo, recebe
prontuário e receita digital assinada.

Três perfis: **PACIENTE** e **MÉDICO** (app Flutter + site), **ADMIN** ("farmácia", só no
site — aprova médicos, vê pagamentos/receita, gerencia usuários).

## Um repositório só (desde 2026-10-03)

| Parte | Onde | Remote | O que é |
|---|---|---|---|
| Site (backend + frontend web + admin) | raiz de `C:\Users\jujuj\TCC-EMACRESCERE` | `origin` → `github.com/hugommeira/TCC-EMACRESCERE` (branch `main`) | Next.js 14 (App Router), TypeScript strict, Prisma + PostgreSQL (Neon), NextAuth v5, TailwindCSS. Deploy: Vercel, `https://tcc-emacrescere.vercel.app`, região `gru1`, auto-deploy a cada push em `main`. |
| App mobile (paciente + médico) | `TCC-EMACRESCERE/mobile/` | o mesmo `origin` do site | Flutter/Dart, consome a API do site via HTTP (nunca acessa o banco direto). Distribuição planejada: Google Play (Teste Interno) ou APK direto — hoje é APK direto, ver seção do QR code. |

**O app é editado em `mobile/`**, no mesmo repositório, branch e commits do site — também
pelas sessões na nuvem. Até 2026-10-03 ele vivia num repo local separado
(`C:\Users\jujuj\emacrescere_app`) e `mobile/` era um espelho via `git subtree`; o espelho
ficou tão atrasado que chegou a não compilar, e a casa do app passou a ser `mobile/`. O
`emacrescere_app` ficou como **arquivo morto local**: não editar, não apagar, não
sincronizar. Não existe mais subtree; o remote `flutter-mobile` do clone local do site é
resto daquela época e não é usado.

### Deploy na Vercel

- **Só a produção altera o banco.** O `npm run build` (`package.json`) roda
  `prisma db push` + `prisma/seed-demo.ts` em produção; numa prévia
  (`VERCEL_ENV=preview`) ele só faz `prisma generate` + `next build` e não toca o banco
  (commit `a11379b`). Rodado localmente, o `VERCEL_ENV` fica vazio e ele **altera** o
  banco de produção — por isso não se roda `npm run build` local.
- O `vercel.json` tem um `ignoreCommand` que decide se o build roda (a Vercel olha só o
  **último** commit do push):
  - mensagem com `[build]` **sempre** builda, em qualquer branch;
  - na `main`, builda quando o commit muda algo **fora** de `mobile/`; commit que toca só
    `mobile/` — ou commit vazio — **não** builda. Para um redeploy na `main` (ex.: depois
    de trocar variável de ambiente no painel), use commit vazio com `[build]`;
  - fora da `main`, só builda com `[preview]` na mensagem, **inclusive em commit vazio**
    (`git commit --allow-empty -m "<texto> [preview]"` e push). Sem a marca, a prévia é
    pulada mesmo que o commit mexa no site;
  - se a Vercel não tiver o commit anterior (clone raso), a comparação falha e o build
    **roda** — o erro é sempre para o lado de construir.

Atenção: a pasta `app/` do site **não** é o aplicativo — é a pasta de rotas do Next.js
(App Router: páginas + API).

## Stack e arquitetura

- **Auth**: NextAuth v5, Credentials provider, sessão JWT (30 dias), + login social Facebook
  (pendente configurar `FACEBOOK_CLIENT_ID/SECRET` — bloqueado por verificação de conta Meta).
  App autentica via cookie de sessão do NextAuth (não bearer token).
- **Banco**: PostgreSQL na NeonDB (`sa-east-1`), Prisma ORM, schema em
  `TCC-EMACRESCERE/prisma/schema.prisma` (530 linhas) — models principais: `User`,
  `PatientProfile`, `DoctorProfile`, `Consultation`, `Message`, `Payment`, `Prescription`,
  `PrescriptionItem`, `Medication`, `MedicalCertificate`, `FollowUp`, `AuditLog`.
- **Pagamentos**: Asaas (sandbox próprio, `PAYMENT_MOCK` controla se aceita simulação).
  Pix, cartão e boleto testados de ponta a ponta em produção.
- **Vídeo**: LiveKit Cloud (projeto próprio, variáveis configuradas). App ainda não
  implementou a chamada (mostra banner); site tem a sala mas depende do CSP liberar os hosts
  regionais do LiveKit (`*.livekit.cloud` — já corrigido).
- **Chat**: originalmente SSE via `pg LISTEN/NOTIFY`, mas **não entrega de forma confiável em
  produção (Neon serverless + Vercel)** — hoje tudo tem fallback de polling (5s no chat, 8s na
  fila, 15s no status da sala).
- **Prescrição digital**: assinatura ICP-Brasil (certificado .pfx do médico, criptografado
  AES-256-GCM, armazenado em S3). App só visualiza/baixa; emissão só pelo site.
- **Storage**: S3-compatível (Contabo Object Storage) — usado pra certificados .pfx, PDFs de
  receita assinada e anexos de consulta.

### Rotas da API (`app/api/*`, todas em `TCC-EMACRESCERE`)
```
admin/{certificates,consultations,doctors,doctors/[id]/approval,payments,prescriptions,
       stats,users/[id]/toggle}
auth/{[...nextauth],forgot-password,reset-password}
chat/[roomToken]/{messages,read,stream}
checkout
consultations, consultations/[id]/{attachments,attachments/upload,cancel,end,messages,
       no-show,prescription,prescription/issue,prontuario,status,summary}
dev/simulate-payment
doctor/{certificate,profile}
followup
livekit/token
medications/search
notifications
prescription/validate
prescriptions/[id]/pdf
queue/{claim,enter,heartbeat,list,position,sse}
realtime/{consultation/[id],patient/[id]}
users, users/[id], users/register
webhooks/asaas
```

## Estado atual (o que já funciona, testado em produção)

- Cadastro/login (paciente e médico) com credenciamento de médico (CRM verificado de forma
  **simulada** — regra: 4-7 dígitos + UF válida; final "000" = não encontrado, "999" = suspenso).
  Admin aprova/reprova em `/dashboard/admin/doctors`.
- Fila on-demand (paga) e agendamento com médico específico (não cobra nesse fluxo hoje).
- Chat texto entre paciente e médico (polling, tanto no app quanto no site).
- Prontuário (diagnóstico/conduta/observações) editável pelo médico, com auto-save.
- Emissão de receita digital assinada (site, com certificado do médico) e visualização/PDF
  no app e no site.
- Painel admin: usuários, médicos (credenciamento), consultas, pagamentos, receitas,
  certificados, auditoria, estatísticas (usuários, médicos ativos, pacientes, consultas,
  receita total, pagamentos pendentes).
- App: 5 abas do paciente (Início, Peso, Consultas, Chat, Perfil) + interface completa do
  médico (Fila, Consultas, Agenda, Perfil) desde 2026-09-11.
- Landing do site com seção "App Android": QR code real (`public/qr-app.svg`, gerado com o
  pacote Dart `qr`) apontando pra `/app.apk` (build arm64 real, ~19 MB, hospedado no próprio
  site, headers corretos pro Android instalar direto).
- Dados de demonstração: `prisma/seed-demo.ts` roda no build de **produção** da Vercel
  (idempotente; prévias não rodam seed nem `db push` — ver "Deploy na Vercel").
  Cria médicos em cada situação de credenciamento (aprovado, pendente com CRM ativo, pendente
  com CRM suspenso, reprovado), pacientes com histórico completo (consultas pagas, evolução
  de peso no prontuário, receitas emitidas, follow-up respondido), base de medicamentos.

## O que NÃO funciona / está fora de escopo

- **Videochamada no app**: não implementada (site tem a sala LiveKit, app só mostra banner).
- **iOS**: fora de escopo (só Android nesta entrega).
- **Cartão de crédito no app**: não implementado (exige campos completos do cartão no
  request; Pix/boleto sim).
- **Plano de acompanhamento recorrente**: não existe no backend (só cobrança por consulta).
- Upload de anexos/certificado: depende do S3 configurado (ver pendências).

## Pendências que só o Hugo resolve (fora do meu acesso)

- `PAYMENT_MOCK` está com o valor de produção configurado na Vercel — pra demonstrar a fila
  on-demand de ponta a ponta sem pagar de verdade, teria que ativar o mock lá (painel da
  Vercel, que eu não acesso).
- Login social Facebook: cadastro de app developer na Meta travado (SMS de verificação não
  chega).
- `robots.txt`/`sitemap.xml`, imagem de Open Graph, monitoramento de erro em produção: nunca
  feitos (baixa prioridade pra um TCC).
- ~52 erros de TypeScript represados (`exactOptionalPropertyTypes`), com
  `ignoreBuildErrors: true` no `next.config.mjs` — dívida técnica pré-existente, documentada,
  não corrigida (não bloqueia nada, mas "remover antes do go-live final" está anotado desde o
  time original).
- 5-6 vulnerabilidades de dependências (npm audit) que só um upgrade major pra Next 16
  resolveria — decisão tomada de não fazer (breaking change, não vale o risco num TCC).

## Contas de teste

### Seed original (`prisma/seed.ts` — sempre existiu)
| Perfil | E-mail | Senha |
|---|---|---|
| Admin | `admin@telemed.com.br` | `Admin@12345` |
| Médico | `dr.silva@telemed.com.br` | `Doctor@12345` |
| Paciente | `maria@email.com` | `Patient@12345` — **CPF inválido (22222222222), Asaas recusa cobrança dela; não usar pra testar pagamento** |

### Seed de demonstração (`prisma/seed-demo.ts` — roda em todo deploy de produção, idempotente; prévias não)
Senha de **todos**: `Demo@12345`.
- Pacientes fictícios (`*@demo.emacrescere.app`): históricos variados (consulta cancelada,
  concluída, agendada, rascunho de receita).
- Pacientes "reais" (nomes/e-mails comuns, tipo `mariana.castro@email.com`,
  `rafael.osantos@email.com`, etc. — 7 no total): 3 a 5 consultas pagas cada, evolução de
  peso registrada no prontuário a cada consulta, receita emitida na primeira, retorno
  marcado. Essas somam na "Receita" do painel admin (~R$ 4.950 s ó delas).
- Médicos: `fernanda.costa`, `ricardo.alves` (credenciados, com certificado simulado),
  `marcos.pereira` (pendente, CRM ativo), `juliana.martins` (pendente, CRM suspenso),
  `otavio.ramos` (reprovado) — todos `*@demo.emacrescere.app`.

### Contas fictícias extras criadas durante QA (produção)
`paciente.teste@emacrescere.test` / `medico.teste@emacrescere.test`, senha `Teste@12345`
(médico já aprovado).

## Como rodar localmente

**Site** (`TCC-EMACRESCERE`): `npm install`, configurar `.env.local` (ver `.env.example`),
`npm run prisma:push`, `npm run dev`.

**App** (`mobile/`), sem celular físico — **no Chrome** (antes, crie `mobile/.env` com a
`API_BASE_URL`; ele não é versionado e sem ele o app nem compila):
```bash
dart run tool/dev_web.dart
```
Sobe o `flutter run -d web-server` + um proxy de API (`:8080` → produção na Vercel, adiciona
CORS) porque o navegador bloqueia cookie cross-site sem isso. **Não** use
`flutter run -d chrome` direto. A porta do app é dinâmica agora (lê `PORT` do ambiente,
cai em `5000` só no fallback manual — foi corrigido recentemente porque `5000` as vezes está
ocupada por outro processo na máquina).

**App num Android físico**: `flutter run -d <device-id>` — aponta direto pra produção
(`API_BASE_URL` no `.env`, git-ignorado).

**Testes**: `flutter test` (app, widget tests de layout) / `npm test` (site, Vitest, 27
testes em lógica pura — formatadores, validação de CPF, rate limiter).

## Convenções e decisões de identidade visual

- Nome do produto: sempre **"Emacrescere"** (nunca "Emaerescere" — typo que já existiu e foi
  corrigido em 37 lugares numa sessão).
- Visual derivado do logo (coração-folha em degradê esmeralda, letreiro verde-escuro):
  `AppColors.ink`/`brandGradient`/`brand100`/`surface` no app
  (`lib/theme/app_theme.dart`); cards planos raio 20 sem sombra, botões/chips pill.
  As referências antigas em `docs/design_reference/*.webp` **não valem mais**.

## Aprendizados técnicos importantes (não repetir os mesmos bugs)

- O backend exige header `Origin`/`Referer` em toda mutação (`lib/security.ts`,
  `checkOrigin`). O app nativo precisa mandar isso manualmente (`ApiClient` já faz, fora da
  web) — sem isso dá 403 "Origem não verificável".
- Flutter: `setState(() => _future = X())` **não funciona** (a closure devolve um Future e o
  `setState` aborta em debug) — sempre usar bloco `setState(() { _future = X(); })`.
- Datas pro backend sempre em UTC (`toUtc().toIso8601String()`) — o servidor interpreta ISO
  sem fuso como UTC.
- Abas do app vivem num `IndexedStack` (todas ficam montadas) — quem precisa de dado fresco
  ao voltar usa `TabVisibilityMixin` (`lib/screens/shell/`).
- SameSite=Lax do cookie de sessão olha o **domínio**, não a porta — por isso mudar a porta
  do dev server local (`tool/dev_web.dart`) não quebra a autenticação.

## Histórico de sessões relevantes (resumo cronológico)

1. **Construção inicial do app** (scaffold Flutter, troca de acesso direto ao Postgres por
   API client, login via NextAuth, navegação de 5 abas, tela de peso/IMC).
2. **2026-08-22/23 (site)**: migração de infra pra conta própria do Hugo (repo, Neon, Vercel),
   responsividade mobile, correção do typo de marca, favicon/ícones, Asaas configurado e
   testado (Pix/cartão/boleto), LiveKit configurado.
3. **2026-08-30 (site)**: análise técnica + 3 correções (checkbox de termos obrigatório,
   rate limit + bug de acesso em `/api/prescription/validate`, primeiros 27 testes
   automatizados).
4. **2026-09-11**: interface completa do médico no app (fila, consultas, agenda, perfil,
   sala de atendimento com prontuário) + credenciamento (CRM simulado, aprovação pelo admin).
   Testado em dispositivo físico, 4 itens do Hugo corrigidos.
5. **2026-09-12**: QA completo nos 3 perfis (revisão final antes da apresentação) — lista
   grande de bugs achados e corrigidos nos dois repos (ver seções acima; destaque: 403 no app
   nativo por falta de `Origin`, sessão de usuário desativado não caía, chat sem tempo real em
   produção, CPF exposto em respostas da API, prontuário não salvava campo vazio, CSP
   bloqueando LiveKit). Criado `prisma/seed-demo.ts` e o botão "Carregar dados de exemplo"
   na aba Peso do app.
6. **2026-09-14**:
   - 7 pacientes "reais" (nomes/e-mails comuns) com consultas pagas e evolução de peso —
     agora a Receita do admin mostra um valor realista (~R$ 4.950 só desses).
   - QR code real + APK real na landing do site (`/#app`), build arm64 hospedado em
     `public/app.apk`.
   - Corrigido: raiz do proxy de dev (`:8080`) redirecionava pro app em vez de dar 404 puro.
   - Corrigido: porta do dev server do app (`tool/dev_web.dart`) agora é dinâmica (lê `PORT`
     do ambiente), porque a porta fixa `5000` as vezes está ocupada por outro processo na
     máquina (aconteceu com um `php.exe` de outro projeto).

7. **2026-09-16**:
   - Bug real reproduzido e corrigido: criar conta pelo app deixava um Login "fantasma" na
     tela (o callback `onLoggedIn` só fechava uma rota da pilha, e o cadastro empilha duas);
     tentar entrar de novo ali crashava ("Null check operator used on a null value" no
     release, "Looking up a deactivated widget's ancestor" em debug). Fix em
     `access_blocked_screen.dart` (`popUntil(isFirst)` guardando o `NavigatorState`).
   - Agenda do médico: ponto de "tem consulta" sobrepunha o número do dia — movido pra
     baixo do círculo.
   - APK novo publicado em `public/app.apk` no site (o QR já baixa a versão corrigida).
   - Build do APK falhou 2x por cache corrompido do Gradle (`transforms/*/metadata.bin`):
     resolve com `gradlew --stop` + apagar `~/.gradle/caches/8.14/transforms`.
   - App espelhado em `TCC-EMACRESCERE/mobile/` via subtree (o repositório separado
     `emacrescere-app` não existia; Hugo optou por manter um repo só).

8. **2026-10-03**:
   - Frentes A (agendamento com horários reais + pagamento), C (peso e IMC pela API) e B
     (fila escondida atrás de `kQueueEnabled`) commitadas e testadas no navegador contra a
     produção, nos perfis paciente e médico.
   - `mobile/` deixou de ser espelho e virou a casa do app; `emacrescere_app` virou arquivo
     morto. `Claude outputs/` saiu do repositório (`.gitignore`).

## Onde encontrar mais detalhes

- `TCC-EMACRESCERE/README.md` — setup, variáveis de ambiente completas, credenciais, deploy,
  seção "App Android" (como gerar um novo APK).
- `TCC-EMACRESCERE/PROJETO-STATUS.md` — log detalhado sessão a sessão da migração de infra e
  correções de segurança (histórico mais antigo, até 2026-08-30).
- `TCC-EMACRESCERE/mobile/CLAUDE.md` — escopo do app, contrato de API por tela, identidade visual,
  aprendizados de QA.
- `TCC-EMACRESCERE/prisma/schema.prisma` — schema completo do banco (mais próximo de um
  "diagrama de dados" que existe; não há diagramas visuais/ER no projeto).
