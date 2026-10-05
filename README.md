# Emacrescere – Plataforma de Telessaúde

Plataforma de telessaúde para acompanhamento médico do emagrecimento, com
atendimento **só por consulta agendada**. TCC da Escola Técnica Pandiá
Calógeras (Técnico de Informática, Equipe 6). Banca: 03/11/2026.

- Site: **https://tcc-emacrescere.vercel.app**
- App no iPhone (versão web): **https://tcc-emacrescere.vercel.app/app/**
- App Android (APK): **https://tcc-emacrescere.vercel.app/app.apk**
- Design: [Figma do projeto](https://www.figma.com/design/4qVl5xVi3V3eREAm4xELvN)
- Estado atual e pendências: [`PROJETO-STATUS.md`](PROJETO-STATUS.md) ·
  roteiro da banca: [`docs/roteiro-demonstracao.md`](docs/roteiro-demonstracao.md)

## O que o sistema faz

- **Paciente:** cadastro (e-mail/senha ou Google), agenda consulta com um médico
  em horário livre da agenda dele, paga (Pix, cartão ou boleto, via Asaas),
  entra na consulta por vídeo, conversa por chat, recebe receita digital
  assinada e acompanha **peso e IMC** num gráfico.
- **Médico:** cadastro com CRM (aprovado pela equipe), agenda própria, sala da
  consulta com vídeo, chat, prontuário com salvamento automático, aba de peso do
  paciente e emissão de receita assinada com o certificado digital dele.
- **Administração:** aprova médicos, acompanha consultas, pagamentos, receitas,
  certificados e o log de auditoria.
- **Público:** validação de receita pelo link impresso no PDF (`/prescricao/{id}`),
  sem login.
- **App** (Flutter, em `mobile/`): paciente e médico no celular. Android por
  APK; iPhone pela versão web do próprio app, instalada pelo Safari.

A plataforma **não vende, não indica e não entrega medicamentos**: toda conduta
é decisão do médico. A fila de atendimento imediato (on-demand) foi descartada
pelo grupo; o código ficou desligado em `QUEUE_ENABLED` (`lib/constants.ts`).

## Stack

| Camada        | Tecnologia                                                  |
|---------------|-------------------------------------------------------------|
| Framework     | Next.js 14 (App Router), React 18                           |
| Linguagem     | TypeScript (strict, `exactOptionalPropertyTypes`)           |
| Estilos       | TailwindCSS 3; 3D com three.js + `@react-three/fiber`/drei  |
| ORM / banco   | Prisma 5 + PostgreSQL (Neon, região `sa-east-1`)            |
| Auth          | NextAuth v5 (Auth.js): e-mail/senha, Google, Facebook*      |
| Pagamentos    | Asaas (sandbox)                                             |
| Vídeo         | LiveKit Cloud                                               |
| E-mail        | Resend (modo sandbox)                                       |
| Tempo real    | SSE + consulta periódica (ver [Tempo real](#tempo-real-e-chat)) |
| Testes        | Vitest                                                      |
| App           | Flutter (`mobile/`)                                         |
| Deploy        | Vercel (região `gru1`), automático a cada push na `main`    |

\* O login com Facebook está pronto no código, mas sem credenciais da Meta
(ver [Autenticação](#autenticação)).

## Estrutura do repositório

```
TCC-EMACRESCERE/
├── app/                        # Next.js App Router (rotas; NÃO é o aplicativo)
│   ├── api/                    # Route handlers: admin, auth, chat, checkout,
│   │                           #   consultations, doctor(s), files, followup,
│   │                           #   livekit, medications, notifications, patient,
│   │                           #   prescription(s), realtime, users, webhooks,
│   │                           #   weight (queue/ e dev/ existem, desligados)
│   ├── auth/                   # login, cadastro (paciente e médico), senha
│   ├── consulta/[id]/          # sala da consulta (vídeo, chat, prontuário, peso, receita)
│   ├── dashboard/
│   │   ├── patient/            # início, agendar, consultas, peso, receitas, perfil
│   │   ├── doctor/             # início, consultas, receitas, certificado, perfil
│   │   └── admin/              # médicos, usuários, consultas, pagamentos,
│   │                           #   receitas, certificados, auditoria
│   ├── prescricao/[id]/        # validação pública de receita
│   ├── privacidade/ termos/    # páginas legais
│   └── page.tsx                # página inicial (seções em components/landing)
├── components/                 # landing, auth, layout, patient, doctor, admin,
│                               #   consulta, weight, prescription, three (3D), ui...
├── hooks/                      # useSSE, useChat, useConsultation, useAuth...
├── lib/                        # auth (auth.ts + auth.config.ts), scheduling, bmi,
│                               #   realtime, s3 (arquivos), sign-pdf, security,
│                               #   audit, oauth-profile, redirect, validations/
├── services/
│   ├── api/                    # regras de negócio (consultation, payment, weight...)
│   └── external/               # Asaas, CFM (simulado), e-mail (Resend)
├── prisma/                     # schema.prisma, seed.ts, seed-demo.ts, medicamentos
├── public/                     # app.apk, app/ (build web do app), 3d/, photos/, QR codes
├── mobile/                     # app Flutter (paciente + médico) — ver mobile/HANDOFF.md
├── docs/                       # roteiro da banca, auditoria, front-end, 3D, fotos
├── art/3d-src/                 # arquivos .blend dos modelos 3D
└── test/                       # stubs dos testes
```

## Setup local

> **Atenção: existe um único banco, e é o de produção.** O `.env.local` aponta
> para ele. Tudo o que você fizer rodando localmente (cadastros, pagamentos de
> teste, pesagens) aparece no site público. Teste que grava dado precisa
> desfazer o que gravou.

```bash
npm install                      # também roda prisma generate
cp .env.example .env.local       # preencher os valores (pedir ao Hugo)
npm run dev                      # http://localhost:3000
```

**Nunca rode `npm run build` localmente.** O script faz `prisma db push` e o
seed de demonstração no banco de produção (em produção isso é desejado; na sua
máquina, não). Também nunca use `prisma db push --accept-data-loss`.

Scripts do Prisma (leem o `.env.local` via `dotenv-cli`, então **agem no banco
de produção**): `npm run prisma:studio`, `prisma:push`, `prisma:seed`,
`prisma:seed-demo`. Num banco novo e vazio, a ordem é `prisma:push` →
`prisma:seed` → `prisma:seed-demo`.

### Verificação antes de enviar

```bash
npx tsc --noEmit | grep -c "error TS"   # 60 erros antigos (dívida): não pode subir
npx vitest run                           # 62 testes
npx eslint <arquivos alterados>          # ou: npx next lint --dir components --dir app
```

O build da Vercel ignora erros de TypeScript e de lint (`ignoreBuildErrors` em
`next.config.mjs`), por isso essa checagem manual é obrigatória.

## Autenticação

NextAuth v5 com sessão JWT (30 dias). A senha fica com hash bcrypt e o papel
(`PATIENT`, `DOCTOR`, `ADMIN`) é revalidado no banco a cada 60 s. O
`callbackUrl` do login só aceita caminhos internos do site.

### Recuperação de senha (Resend)

1. Conta em https://resend.com e uma API key.
2. No `.env.local`: `RESEND_API_KEY=re_...` e
   `EMAIL_FROM="Emacrescere <onboarding@resend.dev>"`.
3. O Resend está em **modo sandbox** (decisão do grupo): "Esqueci minha senha"
   só entrega para o e-mail dono da conta Resend. Sem `RESEND_API_KEY`, o token
   é gerado no banco, mas o e-mail não sai (só um aviso no log).

O link vale 15 minutos e é de uso único.

### Login com Google (ativo em produção)

Credencial "Aplicativo da Web" no Google Cloud (Google Auth Platform), com os
redirecionamentos:

- `https://tcc-emacrescere.vercel.app/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google`

Variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (na Vercel, ambientes
**Production** e, desde 04/10/2026, **Preview**). Escopos: só `openid`, `email` e `profile`. Enquanto o app do
Google estiver em modo "Teste", só entram os e-mails cadastrados como usuários
de teste.

### Login com Facebook (pendente)

O código está pronto, mas falta a credencial: o cadastro de desenvolvedor na
Meta travou na verificação por SMS. Para ativar: app em
https://developers.facebook.com com o produto **Facebook Login**, redirecionamento
`https://tcc-emacrescere.vercel.app/api/auth/callback/facebook` e as variáveis
`FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET`. A Meta exige a URL de instruções
de exclusão de dados: `https://tcc-emacrescere.vercel.app/privacidade#exclusao-de-dados`.

### Regras comuns aos logins sociais

- O botão só aparece quando as duas variáveis do provedor existem.
- Quem entra pelo Google/Facebook é sempre **paciente** (o papel nunca vem de
  fora; médico se cadastra pelo formulário, com CRM).
- O e-mail é obrigatório. No Google, só vale e-mail **verificado** (a conta é
  vinculada pelo e-mail a uma conta existente). Sem e-mail, o login volta para a
  tela com o motivo.
- A foto do perfil é gravada em `avatarUrl` (`lib/oauth-profile.ts`).

## Contas de teste

Senha das contas de demonstração: **`Demo@12345`**. Elas são criadas por
`prisma/seed-demo.ts`, que roda em todo deploy de produção (é idempotente: só
cria o que falta) ou com `npm run prisma:seed-demo`.

| Perfil | E-mail | Situação |
|---|---|---|
| Paciente | mariana.castro@email.com | 4 consultas (88,2 → 83,8 kg), receita emitida — **a melhor para a banca** |
| Paciente | patricia.nunes@email.com | 5 consultas (79,0 → 75,2 kg), receita emitida |
| Paciente | rafael.osantos@email.com | 3 consultas (104,5 → 101,0 kg), receita emitida |
| Paciente | lucasmp@email.com | 3 consultas (96,3 → 93,7 kg) |
| Paciente | ju.ribeiro@email.com | 4 consultas (91,5 → 87,6 kg), receita emitida |
| Paciente | andre.gomes.b@email.com | 4 consultas (112,0 → 106,1 kg), receita emitida |
| Paciente | camila.freitas@email.com | 3 consultas (74,8 → 73,0 kg), receita de controle especial |
| Paciente | ana.souza@demo.emacrescere.app | 2 consultas concluídas, receitas, retorno marcado |
| Paciente | bruno.lima@demo.emacrescere.app | concluída + cancelada + retorno marcado |
| Paciente | carla.mendes@demo.emacrescere.app | receita de controle especial |
| Paciente | diego.ferreira@demo.emacrescere.app | concluída + faltou |
| Paciente | elaine.rocha@demo.emacrescere.app | receita em rascunho |
| Paciente | felipe.andrade@demo.emacrescere.app | consulta próxima |
| Médica | fernanda.costa@demo.emacrescere.app | aprovada, com certificado de teste |
| Médico | ricardo.alves@demo.emacrescere.app | aprovado, com certificado de teste |
| Médico | marcos.pereira@demo.emacrescere.app | aguardando aprovação (CRM ativo) |
| Médica | juliana.martins@demo.emacrescere.app | aguardando aprovação (CRM suspenso) |
| Médico | otavio.ramos@demo.emacrescere.app | reprovado |

Contas do seed inicial (`prisma/seed.ts`): admin `admin@telemed.com.br` /
`Admin@12345`, médico `dr.silva@telemed.com.br` / `Doctor@12345`, paciente
`maria@email.com` / `Patient@12345`. O CPF da Maria (22222222222) é inválido e o
Asaas recusa a cobrança: para testar pagamento, use um paciente de demonstração.

Evite na demonstração o médico `medico.teste@emacrescere.test`: é uma conta de
teste de credenciamento que ficou aprovada no banco.

**Certificado digital dos médicos de demonstração.** No banco de produção, a
Dra. Fernanda e o Dr. Ricardo já têm um certificado de teste **com arquivo**
(gerado pela tela) e emitem receitas assinadas. Num banco novo, o seed cria só
os metadados do certificado; para emitir receita, o médico precisa gerar o
certificado de teste em **Certificado digital** (`/dashboard/doctor/certificate`).
O certificado de teste é autoassinado: a receita sai assinada, mas **sem
validade jurídica** (a página de validação e o PDF avisam isso).

## Pagamentos (Asaas)

Conta sandbox própria, com `PAYMENT_MOCK=false` em produção: Pix, boleto e
cartão geram cobranças reais **de sandbox**. A confirmação chega pelo webhook
`/api/webhooks/asaas` (token no header `asaas-access-token`). Para confirmar um
Pix/boleto, use o painel do Asaas Sandbox, ou ligue `PAYMENT_MOCK=true` na
Vercel (aparece o botão "Simular pagamento"). Consulta não paga segura o horário
por 30 minutos.

Política de cancelamento: reembolso integral cancelando com **24 h ou mais** de
antecedência; com menos de 24 h ou falta do paciente, sem reembolso; se o médico
cancelar, sempre integral.

## Deploy (Vercel)

O deploy é **automático**: cada push na `main` publica o site (projeto
`tcc-emacrescere`, região `gru1`). Merge na `main` = site público mudado, então
só quando o dono do projeto pedir.

O build (`npm run build`, chamado pelo `vercel.json`) faz `prisma generate`,
`prisma db push`, o seed de demonstração e `next build`. Em prévias
(`VERCEL_ENV=preview`) ele **pula** o `db push` e o seed: prévia nunca altera o
banco.

O `ignoreCommand` do `vercel.json` decide se o build roda. A Vercel olha só o
**último commit** do push:

| Situação | Builda? |
|---|---|
| Mensagem com `[build]` (qualquer branch) | sempre |
| `main`, commit que muda algo **fora** de `mobile/` | sim |
| `main`, commit que toca só `mobile/`, ou commit vazio | não (use `[build]` para forçar um redeploy) |
| Outra branch, mensagem com `[preview]` (inclusive commit vazio) | sim (prévia) |
| Outra branch sem `[preview]` | não |
| Vercel sem o commit anterior (clone raso) | sim (o erro é sempre para o lado de construir) |

Consequências práticas:

- Ao juntar várias branches na `main`, deixe **por último** o merge que mexe no
  site; se o último commit tocar só `mobile/`, a Vercel pula o deploy.
- Variável de ambiente nova ou alterada no painel só vale a partir do próximo
  deploy: faça um commit vazio com `[build]` na `main`.
- As prévias são protegidas pelo login da Vercel. O botão do Google aparece
  nelas (as variáveis também estão em Preview), mas o login só funciona no
  endereço **fixo da branch** (`tcc-emacrescere-git-<branch>-….vercel.app`)
  cadastrado nos redirecionamentos do Google; o endereço com código aleatório
  muda a cada deploy e o Google recusa. Detalhes em `docs/frontend-handoff.md`.
- Se o mesmo commit for enviado para uma branch com `[preview]` e depois para a
  `main`, o status "sucesso" no GitHub pode ser o da **prévia**: confira o deploy
  de **Production** antes de testar o site público.

## Tempo real e chat

`lib/realtime.ts` publica eventos por `pg LISTEN/NOTIFY` e as rotas SSE
(`app/api/realtime/*`, `app/api/chat/[roomToken]/stream`) os entregam ao
navegador. Em produção (Neon serverless + Vercel), porém, o `NOTIFY` não chega
de forma confiável. Por isso a interface também **consulta periodicamente**: o
chat da sala a cada 5 s (30 s com a consulta encerrada), e o mesmo vale para o
status da consulta e o prontuário. Quando o SSE funciona, ele só acelera a
entrega.

## Arquivos (certificados, PDFs, anexos)

`lib/s3.ts` usa um bucket S3 (Contabo) quando as variáveis `S3_*` estão
preenchidas; sem elas, guarda tudo no próprio banco (tabela `stored_files`),
com links de download assinados. Hoje o S3 **não** está configurado: os
arquivos ficam no banco. Preencher as `S3_*` muda o armazenamento sem mudar
código.

## App: Android (APK) e iPhone (web) + QR codes

A seção do app na landing (`/#app`) mostra os dois caminhos lado a lado, cada
um com o seu QR code real.

### Android

O QR aponta para `https://tcc-emacrescere.vercel.app/app.apk` (arquivo em
`public/app.apk`, build arm64 do app Flutter, ~19 MB). Para publicar uma versão
nova:

```bash
# dentro de mobile/ (o app vive neste repositório; precisa do mobile/.env)
flutter build apk --release --split-per-abi
cp build/app/outputs/flutter-apk/app-arm64-v8a-release.apk ../public/app.apk
```

Commit + push e a Vercel serve o arquivo (headers em `vercel.json`). O SVG do
QR (`public/qr-app.svg`) só precisa ser gerado de novo se a URL do site mudar
(foi gerado com o pacote Dart `qr`, conteúdo = URL acima).

### iPhone

Não há app na App Store: no iPhone roda a versão web do próprio app, servida
pelo site em **`https://tcc-emacrescere.vercel.app/app/`** (arquivos em
`public/app/`; build e cópia descritos em `mobile/HANDOFF.md`, seção "Versão web
(iPhone)").

Para instalar no iPhone:

1. Abrir `tcc-emacrescere.vercel.app/app` no **Safari**.
2. Tocar em **Compartilhar** (o quadrado com a seta para cima).
3. Tocar em **Adicionar à Tela de Início** e depois em **Adicionar**.
4. Abrir pelo ícone (tela cheia) e entrar com a mesma conta do site.

O QR do iPhone (`public/qr-app-iphone.svg`, conteúdo
`https://tcc-emacrescere.vercel.app/app/`) foi gerado sem acrescentar
dependência ao projeto, nas mesmas cores do QR do Android:

```bash
npx --yes qrcode@1.5.4 -t svg -d 0f3d2eff -l ffffffff -m 2 \
  -o public/qr-app-iphone.svg "https://tcc-emacrescere.vercel.app/app/"
```

Também só precisa ser gerado de novo se a URL do site mudar.

Para atualizar o app web, é preciso gerar o build de novo (`flutter build web`)
e copiá-lo para `public/app/`; mudar só o código em `mobile/` não muda o que
`/app/` serve. Depois da atualização, o iPhone pode manter a versão antiga em
cache: teste numa aba privada ou apague os dados do site no Safari.

## Documentação

| Documento | Para quê |
|---|---|
| [`PROJETO-STATUS.md`](PROJETO-STATUS.md) | estado atual, pendências e histórico |
| [`CLAUDE.md`](CLAUDE.md) | regras e arquitetura para quem (pessoa ou Claude) vai mexer no código |
| [`docs/roteiro-demonstracao.md`](docs/roteiro-demonstracao.md) | roteiro da banca |
| [`docs/auditoria-seguranca.md`](docs/auditoria-seguranca.md) | auditoria de segurança e LGPD |
| [`docs/frontend-handoff.md`](docs/frontend-handoff.md) · [`docs/frontend-diagnostico.md`](docs/frontend-diagnostico.md) | regras visuais e diagnóstico do front-end |
| [`docs/3d/`](docs/3d/BRIEFING.md) · [`docs/fotos/`](docs/fotos/BRIEFING.md) | modelos 3D e fotos do site |
| [`mobile/HANDOFF.md`](mobile/HANDOFF.md) · [`mobile/CLAUDE.md`](mobile/CLAUDE.md) | app Flutter |
| [`docs/contexto-claude-projeto.md`](docs/contexto-claude-projeto.md) | resumo autocontido para o conhecimento do projeto no claude.ai |

## Limitações conhecidas (trabalho futuro)

- Verificação de CRM **simulada** (`services/external/cfm.ts`: final "000" = não
  encontrado, "999" = suspenso). Integração real com o CFM fica para depois.
- Certificado de teste sem validade jurídica (um A1 ICP-Brasil real é pago e
  exige validação presencial).
- Fila on-demand desligada (`QUEUE_ENABLED`), não apagada.
- Login com Facebook sem credenciais; Resend em sandbox; S3 não configurado.
- 60 erros antigos de TypeScript escondidos por `ignoreBuildErrors`.
- Sem `robots.txt`, `sitemap.xml`, imagem de Open Graph e monitoramento de erros.
- Propostas da auditoria ainda não implementadas (CPF cifrado, log de leitura do
  prontuário, limite de login por IP): ver `docs/auditoria-seguranca.md`.
