# Status do projeto — Emacrescere

> Atualizado em **05/10/2026**. Documento de contexto para retomar o trabalho
> (nova máquina, nova sessão do Claude, novo integrante). Não contém segredos:
> valores reais ficam só no `.env.local` e no painel da Vercel.

TCC "Emacrescere" — Escola Técnica Pandiá Calógeras, Técnico de Informática,
Equipe 6. Plataforma de telessaúde para acompanhamento médico do emagrecimento,
com atendimento **só por consulta agendada**. **Banca: 03/11/2026.**

- Site: https://tcc-emacrescere.vercel.app (produção sempre no último commit da `main`)
- App web (iPhone): https://tcc-emacrescere.vercel.app/app/
- Repositório: https://github.com/hugommeira/TCC-EMACRESCERE

## Quem cuida de quê

| Pessoa | Responsabilidade |
|---|---|
| Hugo Meira Maia | site (todo o repositório fora de `mobile/`), GitHub, Vercel, Neon e serviços; **faz os merges na `main`** (merge publica o site) |
| Julia | app Flutter (`mobile/`); envia o trabalho em branches para o Hugo juntar |

## Situação em 05/10/2026

Tudo o que foi desenvolvido está na `main` e publicado. Todas as branches
remotas e todas as prévias da Vercel correspondem a commits que já estão na
`main` (não há trabalho preso em prévia).

Verificado em 05/10/2026: 62 testes passando; `tsc` com os mesmos 60 erros
antigos; páginas principais sem violações de acessibilidade (axe, WCAG 2.2 AA)
na página inicial, login, cadastro e painel do paciente.

### O que está no ar

- **Página inicial** redesenhada (fotos próprias, modelos 3D no desktop, seção
  do app com Android e iPhone e QR codes, botão "Voltar ao topo"). No celular,
  o topo é só texto, para o botão de cadastro caber na primeira tela.
- **Cadastro e login:** e-mail/senha, **Google (ativo)**, Facebook (pronto, sem
  credenciais); recuperação de senha por e-mail (Resend sandbox).
- **Agendamento** com horários reais da agenda do médico, pagamento (Pix,
  cartão, boleto — Asaas sandbox) e cancelamento com estorno pela política.
- **Consulta:** sala com vídeo (LiveKit), chat, prontuário com salvamento
  automático, aba de peso; notas internas do médico nunca chegam ao paciente.
- **Receita digital** emitida na plataforma, assinada com o certificado do
  médico, PDF e validação pública em `/prescricao/{id}`.
- **Peso e IMC** (`WeightRecord`): página do paciente e aba na sala. O IMC é
  calculado na leitura (`lib/bmi.ts`), não é coluna.
- **Admin:** aprovação de médicos, consultas, pagamentos, receitas,
  certificados, auditoria.
- **App** (`mobile/`): paciente e médico; Android por APK, iPhone pela versão web
  em `/app/`. O app também agenda com pagamento e não mostra a fila.

## Serviços e variáveis de ambiente

| Serviço / variável | Status |
|---|---|
| Neon (`DATABASE_URL`) | ✅ banco único, **é o de produção** (`sa-east-1`) |
| Vercel | ✅ projeto `tcc-emacrescere`, região `gru1`, deploy automático na `main` |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` | ✅ |
| Google (`GOOGLE_CLIENT_ID/SECRET`) | ✅ ativo em produção (e em Preview desde 04/10); app do Google em modo Teste |
| Facebook (`FACEBOOK_CLIENT_ID/SECRET`) | ⏳ bloqueado: cadastro de desenvolvedor na Meta não passa da verificação por SMS |
| Asaas (`ASAAS_*`, `PAYMENT_MOCK=false`) | ✅ sandbox; Pix, boleto e cartão testados de ponta a ponta; webhook em `/api/webhooks/asaas` |
| LiveKit (`LIVEKIT_*`, `NEXT_PUBLIC_LIVEKIT_URL`) | ✅ projeto próprio no LiveKit Cloud |
| Resend (`RESEND_API_KEY`, `EMAIL_FROM`) | ✅ em **sandbox** de propósito (só entrega para o dono da conta) |
| `PFX_ENCRYPTION_KEY` | ✅ cifra os certificados dos médicos |
| S3 / Contabo (`S3_*`) | ⏳ não configurado: arquivos ficam no banco (`stored_files`), sem prejuízo de função |

## Regras de trabalho (resumo — detalhes no `CLAUDE.md` e no `README.md`)

- Nunca `npm run build` local (altera o banco de produção); nunca
  `prisma db push --accept-data-loss`; teste que grava dado desfaz o que gravou.
- Nunca `git push --force` nem `git reset --hard`; nenhum `.env*` no histórico.
- Merge na `main` só com o Hugo. Antes de enviar: `tsc` sem passar de 60,
  `vitest` verde, eslint nos arquivos alterados.
- Vercel: só o **último commit** do push conta; `[build]` força, `[preview]`
  gera prévia fora da `main`, commit só em `mobile/` não builda o site. Ao juntar
  várias branches, o merge que mexe no site vai por último.

## Pendências

**Antes da banca**

1. Testar o login com Google com um e-mail de usuário de teste e decidir se o
   app do Google é publicado (sai do modo Teste) antes da banca.
2. Testar o QR code do iPhone num aparelho real (aba privada do Safari).
3. Documento do TCC: tirar o IMC do MER e do diagrama de classes (o sistema
   calcula o IMC na hora). A Julia se ofereceu para refazer os diagramas.
4. Ensaiar o roteiro (`docs/roteiro-demonstracao.md`). Evitar o médico
   `medico.teste@emacrescere.test` (conta de teste que ficou aprovada).
5. Calendário sugerido: congelar funcionalidades em 20/10 e, depois disso, só
   correções e preparação da demonstração.

**Depois, se houver tempo**

- Credenciais do Facebook (Meta).
- Contraste do botão verde padrão (branco sobre `brand-600`, 3,8:1), usado por
  exemplo em "Selecionar" no cartão do médico.
- Propostas da auditoria (`docs/auditoria-seguranca.md`): CPF cifrado, log de
  leitura do prontuário, limite de login por IP, validade menor da sessão.
- 60 erros antigos de TypeScript (escondidos por `ignoreBuildErrors`).
- `robots.txt`, `sitemap.xml`, imagem de Open Graph, monitoramento de erros.
- O build web do app ocupa ~43 MB no git (inclui arquivos `.symbols`); cada build
  novo commitado soma isso ao histórico.
- `images.pexels.com` ainda está liberado na CSP, embora as fotos agora sejam
  locais (`public/photos/`).

## Decisões registradas

- **Escopo:** atendimento só por agendamento; a fila on-demand foi descartada
  pelo grupo e ficou desligada (`QUEUE_ENABLED` no site, `kQueueEnabled` no app).
- **Cancelamento:** reembolso integral com 24 h ou mais de antecedência; menos
  de 24 h ou falta, sem reembolso; médico cancela, integral.
- **Receita:** emitida na plataforma com o certificado do médico; nos médicos de
  demonstração, certificado de teste (sem validade jurídica, declarado).
- **IMC** calculado a partir do peso e da altura; corrigir a altura corrige o
  histórico inteiro.
- **iPhone:** sem App Store; versão web do app em `/app/`, instalada pelo Safari.
- **Domínio próprio:** não (fica no `.vercel.app` gratuito).
- **Histórico do git:** o repositório próprio tem histórico limpo; o completo
  está no repositório do orientador (`valmeidavr/TCC-ETPC`).
- **Resend em sandbox:** suficiente para demonstrar a recuperação de senha.
- **Redesign "Consultório"** (30/09): descartado por enquanto; guardado na branch
  local `guardado/redesign-consultorio` e no stash, recuperável.

## Histórico

**Agosto/2026 — migração e base**

- Projeto migrado das contas do orientador para contas próprias (GitHub, Neon,
  Vercel). Credencial real do Neon que estava no `.env.example` foi removida.
- Recuperação de senha por e-mail (token SHA-256, 15 min, uso único, sem
  enumeração de contas) e código do login com Facebook.
- Next.js 14.2.4 → 14.2.35 (corrige o bypass de middleware CVE-2025-29927);
  ESLint consertado; `.gitignore` passou a cobrir `*.pfx`/`*.p12`.
- LiveKit e Asaas configurados e testados; responsividade do painel no celular;
  marca "Emacrescere" corrigida em todo o código; favicon e ícones.
- 30/08: aceite obrigatório de Termos/Privacidade no cadastro; rate limit e rota
  pública corrigida na validação de receita; primeira suíte de testes (Vitest).

**Setembro/2026 — escopo e fluxo completo**

- 12/09: auditoria de segurança dos itens 8–10 (diagnóstico, sem código).
- 29/09: escopo "só agendamento" (`83ff90f`), promessas que a plataforma não
  cumpre removidas, horários reais da agenda do médico, valor decidido no
  servidor, retornos de demonstração sempre no futuro.
- 30/09: arquivos no banco quando não há S3; receita de ponta a ponta (emissão,
  PDF, validação pública); cancelamento com estorno; cadastro de médico pelo
  site; roteiro da banca.

**Outubro/2026 — segurança, design, peso, Google e app**

- 02/10: revisão de segurança independente — fila SSE exige médico aprovado,
  notas internas do médico não chegam ao paciente, `callbackUrl` só aceita
  caminho interno (`1d1dc85`); textos falsos da página inicial corrigidos;
  registro de **peso e IMC** (`12c3ebe`); login com Facebook pronto para receber
  credenciais (`522bbcb`).
- 03/10: trava das prévias (não alteram o banco); **login com Google**
  (`08ac7e8`); página inicial, autenticação e início do paciente redesenhados,
  com fotos próprias e **modelos 3D** (`2b31403`).
- 04/10: o app passa a viver em `mobile/` (`33993fa`), regra de build por
  `[build]`/`[preview]`/`mobile/` (`4d285a9`), redesenho do app (`7a656cf`), **app
  web em `/app/`** (`fa8fb8d`) e seção da página inicial com o caminho do iPhone
  (`6bc59b5`).
- 05/10: build novo do app web (onboarding não trava; `77d45bf`) e correção dos
  menus de notificações e conta que ficavam por baixo do conteúdo no celular
  (`77c7307`); documentação revisada contra o código; na página inicial:
  botão "Voltar ao topo", selo "Acompanhamento médico" tirado da foto de
  comida, "LGPD" trocado por "consulta por vídeo" nos destaques (a LGPD fica no
  FAQ e no rodapé), foto nova da consulta por vídeo e topo do celular só com
  texto, sem o celular 3D.
