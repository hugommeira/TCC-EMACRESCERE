# Status do projeto — Emacrescere

> Documento de contexto para retomar o trabalho rapidamente (nova máquina, nova sessão do Claude Code, ou novo integrante da equipe). Não contém segredos — valores reais ficam só no `.env.local` (nunca commitado).

## Contexto

TCC "Emacrescere" (Escola Técnica Pandiá Calógeras, curso Técnico de Informática, Equipe 6) — plataforma de telemedicina on-demand para tratamento de emagrecimento. Stack: Next.js 14 (App Router), TypeScript strict, Prisma + PostgreSQL (Neon), NextAuth v5, TailwindCSS.

## Migração de infraestrutura (concluída)

O projeto originalmente vivia nas contas do orientador (`github.com/valmeidavr/TCC-ETPC`, Neon e Vercel dele). Foi migrado para contas próprias do aluno Hugo Meira Maia:

- **Repositório**: `github.com/hugommeira/TCC-EMACRESCERE` — histórico limpo (não é o histórico completo do time; esse continua preservado no repositório do orientador e no clone local `TCC-ETPC`, caso seja necessário para a documentação do TCC).
- **Banco de dados**: projeto próprio no Neon (região `sa-east-1`), schema aplicado via `prisma db push`, seed rodado (`prisma/seed.ts` + `prisma/seed-medications.ts` — 300 medicamentos ANVISA).
- **Deploy**: Vercel, projeto `tcc-emacrescere`, região `gru1` (São Paulo), branch `main` com auto-deploy a cada push.
  - URL: `https://tcc-emacrescere.vercel.app`

## Funcionalidades implementadas nesta sessão

- **Recuperação de senha por e-mail**: `/auth/forgot-password` → `/auth/reset-password`, reaproveitando o model `VerificationToken` do Prisma (token hash SHA-256, expira em 15min), envio via Resend, mensagens anti-enumeration, rate limiting, timing normalizado (piso de 500ms na resposta).
- **Login com Facebook (OAuth)**: provider adicionado ao NextAuth, vínculo automático a conta existente pelo e-mail, criação de `PatientProfile` para novos cadastros via Facebook. Ainda precisa das credenciais do Meta for Developers (ver pendências).
- **Login por e-mail**: já existia no projeto original, validado.

## Correções de segurança/infra encontradas e resolvidas

- Credencial real do Neon (do orientador) estava commitada em `.env.example` desde o primeiro commit — removida, trocada por placeholder.
- `.eslintrc.json` estava quebrado desde o início (`next/typescript` não existe na versão instalada do `eslint-config-next`, e faltava o pacote `@typescript-eslint/eslint-plugin`) — `npm run lint` nunca tinha funcionado. Corrigido.
- Next.js atualizado `14.2.4 → 14.2.35` (mesma linha, sem breaking changes) + `npm audit fix` — eliminou as 4 vulnerabilidades críticas, incluindo bypass de autorização no middleware (CVE-2025-29927). Restam 6 altas + 1 baixa que só um upgrade major pra Next 16 resolveria (não feito, é breaking change).
- `.gitignore` não cobria `*.pfx`/`*.p12` (certificados digitais dos médicos) — corrigido.
- `NEXT_PUBLIC_LIVEKIT_URL` era usada em `next.config.mjs` (CSP) mas não estava documentada em `.env.example` — adicionada, junto com as demais variáveis que faltavam (Asaas, S3, PFX).
- Branding "TeleMed" hardcoded em `app/layout.tsx` (metadata/SEO) e `components/prescription/PrescriptionView.tsx` não respeitava `NEXT_PUBLIC_APP_NAME` — corrigido para usar a constante `APP_NAME` (`lib/constants.ts`), agora consistente como "Emacrescere".

## Verificação pós-migração (2026-08-22)

Nova máquina, ambiente reinstalado e validado do zero:

- `.env.example` tinha sido apagado do disco (não commitado assim, só arquivo local ausente) — restaurado via `git restore`.
- `prisma generate` falhava com `EPERM` por causa de um `next dev` órfão de outra sessão ainda rodando e travando o binário do Prisma Client — processo encerrado, geração ok.
- `npm run typecheck`, `npm run build` e conexão com o Neon (300 medicamentos + seed de usuários) confirmados OK, sem regressão.
- `npm run lint` (corrigido em sessão anterior) revelou 3 erros reais nunca vistos antes (import não usado, `let`→`const`, import de tipo sem `import type`) — corrigidos.
- Scripts `prisma:push/migrate/studio/seed` não funcionavam via `npm run` porque a Prisma CLI só carrega `.env`, não `.env.local` — corrigido com `dotenv-cli`.
- `npm audit fix` (sem `--force`) eliminou a vulnerabilidade do `brace-expansion`. Restam 5 altas + 1 baixa (Next.js/glob/postcss), todas só resolvidas com upgrade major pra Next 16 — mantido como está (breaking change, decisão já registrada).
- Identidade git (`user.name`/`user.email`) não estava configurada na máquina nova — configurada localmente no repo (não global).

## Dívida técnica pré-existente (não introduzida nesta sessão, não corrigida)

- `next.config.mjs` tem `typescript.ignoreBuildErrors: true` e `eslint.ignoreDuringBuilds: true`, com TODO do próprio time original: "~30 erros pré-existentes de TS... remover antes do go-live final". Há ~52 erros de `exactOptionalPropertyTypes` espalhados por ~19 arquivos (não relacionados a auth). Rodar `npm run typecheck` pra ver a lista.

## Variáveis de ambiente (valores reais só no `.env.local`, nunca no git)

| Variável | Status |
|---|---|
| `DATABASE_URL` | ✅ configurada (Neon próprio) |
| `NEXTAUTH_SECRET` | ✅ gerada |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | ✅ `https://tcc-emacrescere.vercel.app` em prod |
| `RESEND_API_KEY` | ✅ configurada e testada (envio real confirmado) — **modo sandbox mantido de propósito** (decisão abaixo) |
| `PFX_ENCRYPTION_KEY` | ✅ gerada |
| `FACEBOOK_CLIENT_ID` / `SECRET` | ⏳ pendente — precisa criar app em developers.facebook.com |
| `LIVEKIT_*` | ⏳ pendente — precisa criar projeto no LiveKit Cloud |
| `ASAAS_*` | ⏳ pendente — usando `PAYMENT_MOCK=true` por enquanto |
| `S3_*` (Contabo) | ⏳ pendente — precisa criar bucket no Contabo Object Storage |

Ver `.env.example` para a lista completa comentada.

## Pendências de decisão do usuário

- Domínio customizado na Vercel: **decidido que não** (sem custo, ficando no `.vercel.app` gratuito).
- Histórico de commits completo vs. limpo no repo próprio: **decidido manter o limpo** (histórico completo preservado no repo do orientador).
- Resend em modo sandbox (`onboarding@resend.dev`, só entrega pro e-mail dono da conta) vs. verificar domínio próprio: **decidido manter sandbox** — é um TCC, não produção com usuários reais; sandbox já cobre a demonstração do fluxo de "esqueci minha senha" na defesa. Verificar domínio fica como opção futura caso o projeto vire produto real.
