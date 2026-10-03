# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Emacrescere — guia para o Claude

Plataforma de telessaúde (Next.js 14 App Router, React 18, TypeScript, Tailwind 3,
Prisma + PostgreSQL no Neon, NextAuth v5) que liga pacientes a médicos para
acompanhamento de obesidade e doenças metabólicas. É um TCC (banca em 03/11/2026):
quebrar o que já funciona custa mais do que faltar funcionalidade.

## Regras que valem sempre

- A plataforma **não vende, indica nem dispensa medicamentos**; toda conduta
  clínica e qualquer prescrição são decisão do médico. Nenhum texto, imagem
  ou 3D pode sugerir o contrário nem prometer resultado. Também não há
  "farmácias parceiras" (não existe parceria).
- A receita é emitida na própria plataforma e assinada com o certificado digital
  do médico. Não é pelo Portal do CFM e não se promete ICP-Brasil (o certificado
  de teste não é).
- Textos do site só afirmam o que o código faz. Sem números, depoimentos ou
  parcerias inventados.
- Paciente e médico são experiências **diferentes** (o médico usa o tom escuro).
- Consulta **só com hora marcada**. A fila on-demand foi descartada pelo grupo:
  nenhum texto, tela ou asset fala em fila (o código fica desligado em
  `QUEUE_ENABLED`, `lib/constants.ts`; não apagar).
- Cancelamento: reembolso integral com 24 h ou mais de antecedência; com menos
  de 24 h ou falta do paciente, sem reembolso; se o médico cancelar, integral.
- `mobile/` é o app Flutter de outra pessoa, em outra máquina: não editar.

## Banco, deploy e git (o que não se pode quebrar)

- Existe **um único banco (Neon) e ele é o de produção**; `.env.local` aponta
  para ele. Teste que grava dado precisa desfazer o que gravou.
- **Nunca rode `npm run build` localmente**: o script faz `prisma db push` e o
  seed de demonstração no banco real. Nunca `prisma db push --accept-data-loss`.
  Para checar o build, use `tsc`, `lint` e `vitest` (abaixo).
- A Vercel faz deploy automático a cada push na `main` (região gru1), então
  **merge/push na main publica o site**: só quando o dono do projeto pedir.
  Em prévias (`VERCEL_ENV=preview`) o script `build` do `package.json` pula
  `db push` e seed. Não use `ignoreCommand` no `vercel.json` (já foi tentado e
  cancelou também o deploy de produção).
- Nunca `git push --force` nem `git reset --hard`. Nunca imprimir valores de
  chaves/senhas; antes de um push, conferir que nenhum `.env*` (fora o
  `.env.example`) entrou no histórico.
- Os arquivos usam CRLF: ao editar por script, normalize `\r\n`.

## Comandos

```bash
npm run dev                 # servidor local em :3000 (usa o banco real!)
npx vitest run              # todos os testes (**/*.test.ts, ambiente node)
npx vitest run lib/scheduling.test.ts      # um arquivo
npx vitest run -t "nome do teste"          # um teste por nome
npx tsc --noEmit | grep -c "error TS"      # baseline 60 (dívida antiga): não pode subir
npx next lint --dir components --dir app   # ou: npx eslint <arquivos alterados>
npm run prisma:studio | prisma:seed-demo   # via dotenv -e .env.local
```

Antes de enviar mudanças de código: `tsc` sem passar de 60, `vitest` verde e
eslint nos arquivos alterados. O build ignora erros de TypeScript e de lint
(`ignoreBuildErrors` em `next.config.mjs`), por isso a checagem manual importa.

Contas de demonstração (senha `Demo@12345`): pacientes `patricia.nunes@email.com`
e `mariana.castro@email.com` (esta tem pesagens); médica aprovada
`fernanda.costa@demo.emacrescere.app`; médico pendente
`marcos.pereira@demo.emacrescere.app`. Evitar na demonstração o médico
`medico.teste@emacrescere.test`. O login limita 5 tentativas por 15 min por
e-mail, em memória: reiniciar o dev server zera. Roteiro da banca em
`docs/roteiro-demonstracao.md`.

## Arquitetura

- **Auth em duas metades.** `lib/auth.config.ts` é edge-safe (sem Prisma) e é
  usada por `middleware.ts`, que protege rotas e restringe `/dashboard/{patient,
  doctor,admin}` por papel. `lib/auth.ts` é Node-only: adapter Prisma, sessão
  JWT, Credentials (bcrypt, senha guardada em `Account.access_token`) e os
  provedores sociais. Facebook e Google só ligam se as variáveis
  `*_CLIENT_ID`/`*_CLIENT_SECRET` existirem; só aceitam e-mail verificado e o
  papel é sempre `PATIENT` (`lib/oauth-profile.ts`). O callback `jwt` revalida
  `active` e `role` no banco a cada 60 s. `callbackUrl` só aceita caminho
  interno (`lib/redirect.ts`).
- **Camadas.** `app/api/**` (route handlers) validam com zod em
  `lib/validations/`; o front chama via `services/api/*` (cliente tipado) e
  `services/external/*` (Asaas = pagamento, CFM, e-mail). Efeitos sensíveis
  passam por `lib/audit.ts`.
- **Tempo real.** `lib/realtime.ts` junta um EventEmitter por processo com um
  único `LISTEN` do Postgres; as rotas SSE (`app/api/realtime/*`, `queue/sse`)
  assinam canais `consultation:<id>`, `patient:<id>`, `doctor:<id>`, `queue`.
  Limite de conexões SSE por usuário. A fila SSE exige médico aprovado.
- **Consulta.** Vídeo por LiveKit (`lib/livekit.ts`, `app/api/livekit`), chat e
  notas na sala (`app/consulta`). As notas internas do médico nunca chegam ao
  paciente. Agendamento: `lib/scheduling.ts` (funções puras, fuso fixo -03:00,
  slots de 60 min, consulta não paga segura o horário por 30 min). Pagamento
  confirmado pelo webhook do Asaas (`app/api/webhooks/asaas`).
- **Receita.** `lib/prescription-pdf.ts` gera o PDF e `lib/sign-pdf.ts` assina com
  o certificado do médico (`MedicalCertificate`; o .pfx e a senha são cifrados com
  `lib/crypto.ts` em `services/api/certificate.ts`);
  validação pública em `app/api/prescription/validate` e `app/prescricao/[id]`.
- **Peso e IMC.** Tabela `WeightRecord` (`/dashboard/patient/peso` e aba Peso na
  sala). O IMC não é coluna: é calculado em `lib/bmi.ts`.
- **Schema** em `prisma/schema.prisma` (modelo `User` com `Role`,
  `PatientProfile`, `DoctorProfile`, `Consultation`...). Alterações de schema
  vão para produção no deploy (`db push`): cuidado redobrado.
- **3D** (`@react-three/fiber` v8 + drei) em `public/3d/`, com CSP restritivo em
  `next.config.mjs` (sem CDN: tudo hospedado no próprio site).

## Onde está cada coisa

- Continuar o front-end (regras visuais, o que já foi feito, próximos passos):
  `docs/frontend-handoff.md`. Diagnóstico técnico: `docs/frontend-diagnostico.md`.
- **Assets 3D / Blender:** `docs/3d/BRIEFING.md` (comece por ele), depois
  `ASSETS.md`, `EXPORT.md` e `STATUS.md`. Skills em `.claude/skills`. São 3
  assets (`logo-heart`, `phone-app`, `seal-signature`); commits do trabalho 3D
  só com `public/3d/`, `art/3d-src/` e `docs/3d/STATUS.md`, na branch
  `3d-assets`.
- **Fotos:** `docs/fotos/BRIEFING.md` (alta qualidade sempre; servir de
  `public/photos/`, com fonte e licença registradas).
- `README.md` traz as contas e o roteiro da banca; `PROJETO-STATUS.md` está
  desatualizado.
