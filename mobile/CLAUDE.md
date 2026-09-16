# CLAUDE.md — Emacrescere App (Paciente)

## Sobre o projeto
Emacrescere é uma plataforma de telemedicina on-demand para acompanhamento de
tratamento de emagrecimento. Este repositório é o APP MOBILE, com as interfaces
de PACIENTE e de MÉDICO (a do médico entrou em 2026-09-11). O administrador
("farmácia") usa apenas o site web (Next.js, repo ~/TCC-EMACRESCERE), que
também é o backend de tudo.

## Stack do app
- Flutter (Dart)
- Consome a API do backend Next.js 14 (App Router) já existente
- Autenticação: NextAuth v5 no backend — o app deve autenticar via API (definir
  se é JWT/session token) e persistir sessão localmente
- Banco de dados: PostgreSQL (NeonDB), acessado somente via API do backend —
  o app NUNCA acessa o banco diretamente
- Pagamentos: Asaas (via backend)
- Videochamada: LiveKit
- Chat: SSE (Server-Sent Events) no backend — avaliar como consumir no Flutter
  (polling, cliente SSE, ou WebSocket se disponível)
- Prescrição digital: assinatura ICP-Brasil (gerada pelo backend/médico; o
  app do paciente apenas visualiza/baixa a prescrição)

## Escopo do app (paciente) — estado em 2026-09-11
- Cadastro/login — feito (NextAuth Credentials via API)
- Escolha/compra de plano de acompanhamento (Asaas) — não existe no
  backend (só cobrança por consulta); compra fica no site
- Entrar na fila de atendimento — feito (POST /api/queue/enter com Pix/
  boleto, tela de pagamento, espera na fila com heartbeat, sala com chat).
  Cartão de crédito ainda não (exige dados completos do cartão no request).
  Backend recusa (409) se já houver consulta SCHEDULED/WAITING/IN_PROGRESS.
  "Simular pagamento" só funciona com PAYMENT_MOCK=true no servidor —
  em produção hoje está DESLIGADO (o /api/dev/simulate-payment responde 404).
- Agendar com médico específico — feito (POST /api/consultations), mas o
  backend não cobra nesse fluxo (só na fila)
- Chat com o médico — feito (polling 5s; backend tem SSE se quiser trocar)
- Videochamada com o médico (LiveKit) — NÃO feito; sala mostra banner
- Visualizar/baixar prescrições digitais — feito (PDF só nativo)
- Histórico de atendimentos — feito
- Acompanhamento de peso/IMC — feito, mas só local (sem endpoint)

## Interface do MÉDICO (2026-09-11) — lib/screens/doctor/
- Cadastro: RegisterScreen com seletor Paciente/Médico; médico informa
  CRM/UF/especialidade. CredentialCheckDialog mostra a verificação do CRM
  como etapas — é SIMULADA (regra no backend, services/external/cfm.ts:
  4-7 dígitos + UF válida; final "000" = não encontrado, "999" = suspenso).
  POST /api/users/register com role "DOCTOR" cria a conta PENDING.
- StartupGate: role DOCTOR -> GET /api/doctor/profile -> approvalStatus
  APPROVED = DoctorShell; senão DoctorPendingScreen (com motivo se reprovado).
- Aprovação/reprovação: admin no site em /dashboard/admin/doctors
  (POST /api/admin/doctors/[id]/approval). Médico não aprovado recebe 403
  em /api/queue/list e /api/queue/claim e não aparece pra agendamento.
- DoctorShell: Fila (GET /api/queue/list, polling 8s; Atender = POST
  /api/queue/claim), Consultas (GET /api/consultations, que pra DOCTOR
  devolve as dele), Agenda (AgendaScreen, a tela reservada pro médico) e
  Perfil (GET/PATCH /api/doctor/profile, switch "disponível").
- DoctorRoomScreen: chat pelo roomToken + prontuário (PATCH
  /api/consultations/[id]/prontuario) + Encerrar (POST .../end). Receita
  continua só no site (precisa do certificado ICP-Brasil).
- Pra testar o médico no Chrome sem cadastrar: conta seed dr.silva (já
  APPROVED por default). O cadastro de médico só funciona depois que o
  site for deployado com o commit 1077d17 e `npx prisma db push` rodado —
  o backend antigo ignora o role e criaria um PACIENTE.

## Fora de escopo
- Telas de administrador (ficam só no site — inclusive aprovar médicos)
- iOS (só Android nesta entrega)

## Distribuição
- Google Play, faixa de Teste Interno (Android)
- Plano B: gerar .apk e disponibilizar direto no site

## Convenções
- Seguir estrutura de pastas padrão Flutter (lib/screens, lib/widgets,
  lib/services, lib/models, lib/providers ou state management escolhido)
- Nomear o projeto/app sempre como "Emacrescere" (nunca "Emaerescere")
- Antes de gerar telas, sempre confirmar o contrato da API (endpoints, formato
  de request/response) olhando o código do backend, se estiver disponível
  neste ambiente; se não estiver, perguntar ao usuário o endpoint exato antes
  de inventar um.

## Identidade visual (decisão de 2026-09-11)
As referências em `docs/design_reference/*.webp` NÃO valem mais — Hugo pediu
um estilo mais moderno e intuitivo derivado do logo (coração-folha em
degradê esmeralda, letreiro verde-escuro). Tudo mora em
`lib/theme/app_theme.dart` e `lib/widgets/brand_mark.dart`:
- Cor: `AppColors.ink` (verde-escuro do letreiro) pra títulos; degradê
  `AppColors.brandGradient` (brand700→brand500→teal400) no header e em
  azulejos de ícone; `brand100` como borda fina dos cards (o anel do logo);
  fundo `AppColors.surface` (branco-menta). `leaf` é acento pontual.
- Forma: cards planos, raio 20, sem sombra (vem do `CardTheme` — não passe
  `shape` nos `Card`s); botões e chips pill; inputs raio 14; ícones em
  "azulejos" arredondados com `brandGradientSoft`.
- Marca: `assets/logo/mark.svg` é o mesmo path do site
  (`components/landing/Logo.tsx`), via `flutter_svg`. `BrandTile` = símbolo
  no azulejo com degradê (igual ao ícone do site), `BrandLockup` = tile +
  "Emacrescere". Usados no header (marca d'água), bloqueio, login e
  onboarding.
- Navegação: `NavigationBar` (Material 3) com indicador menta.

## Como rodar / testar
- Flutter 3.38.5 / Dart 3.10.4 (`flutter --version` pra conferir)
- `flutter pub get` antes de rodar
- `flutter run -d <device-id>` — use `flutter devices` pra listar (Android
  físico ou emulador; Windows precisa de Visual Studio, que não está
  instalado)
- **No Chrome (sem celular):** `dart run tool/dev_web.dart` e abrir
  `http://localhost:5000`. NÃO use `flutter run -d chrome` direto — ver
  nota de CORS/cookie abaixo. O script sobe o `flutter run -d web-server`
  (:5000) e um proxy de API (:8080) que repassa `/api/*` pra Vercel
  adicionando CORS. Teclas `r`/`R`/`q` funcionam no terminal, ou via
  `curl localhost:8080/__dev/reload` / `/__dev/restart`. Também está em
  `.claude/launch.json` como config "web". Se a primeira carga ficar em
  tela preta (abriu antes de compilar), só recarregar a página.
- Dados locais (peso, onboarding visto) ficam no `localStorage` da origem
  `localhost:5000` — não são os mesmos do celular.
- `API_BASE_URL` já configurada em `.env` (git-ignorado), apontando pro
  backend em produção: `https://tcc-emacrescere.vercel.app`
- Testes automatizados: `flutter test` — widget tests de layout das telas
  de fila/pagamento (`test/queue_screens_test.dart`) e do cadastro/
  credenciamento do médico (`test/doctor_screens_test.dart`), 320px de
  largura, sem rede. Rode antes de commitar mudanças de UI.

### Contas de teste (seed do backend, `prisma/seed.ts` do repo Next.js)
Já documentadas publicamente no `README.md` do backend — não são segredo.

| Perfil   | E-mail                    | Senha          |
|----------|----------------------------|----------------|
| Admin    | admin@telemed.com.br       | Admin@12345    |
| Médico   | dr.silva@telemed.com.br    | Doctor@12345   |
| Paciente | maria@email.com            | Patient@12345  |

Login validado end-to-end com a conta de paciente (`AuthService.login()` +
cookie de sessão aceito em `/api/auth/session`).

### Nota sobre CORS/cookie ao testar
`AuthService` autentica via cookie de sessão do NextAuth (não bearer token).
Rodando nativo (Android/iOS/desktop) isso funciona sem problema. Rodando no
Chrome/Edge (Flutter Web) direto contra a Vercel, o navegador bloqueia:
o backend não manda cabeçalhos CORS e o cookie é cross-site. Por isso na
web o `ApiClient` aponta pro proxy local `http://localhost:8080`
(`tool/dev_web.dart`), que adiciona CORS; como `localhost:5000` (app) e
`localhost:8080` (proxy) são o mesmo *site* pro navegador, o cookie
`SameSite=Lax` do NextAuth é enviado e aceito. (Servir o app pelo proxy,
mesma origem, foi tentado e descartado: o DWDS do hot reload usa a URL
absoluta do dev server e quebrava.)
Diferenças de comportamento na web, todas guardadas por `kIsWeb`:
- `AuthService.login()` confirma o sucesso via `/api/auth/session` (o XHR
  do navegador segue o 302 sozinho e não expõe o header `Location`).
- Cookie fica no navegador, não no `cookie_jar`.
- Download de PDF da prescrição não funciona (só nativo).
- Links pro site (esqueci a senha etc.) usam `ApiClient.siteUrl`, a URL
  real da Vercel, não a origem do proxy.

## Aprendizados do QA de 2026-09-12 (não esquecer)
- O backend exige `Origin`/`Referer` em toda mutação (`lib/security.ts`,
  `checkOrigin`). O HttpClient nativo não manda nada — o `ApiClient` seta
  `Origin: <API_BASE_URL>` fora da web (na web o navegador proíbe e o
  proxy de dev reescreve). Sem isso, cadastro/fila/chat/prontuário dão
  403 "Origem não verificável" no celular.
- `setState(() => _future = X())` NÃO funciona: a closure devolve o Future
  e o Flutter aborta o setState (assert em debug). Sempre bloco:
  `setState(() { _future = X(); })`.
- Abas do `MainShell` vivem num IndexedStack: quem precisa de dados
  frescos ao voltar usa `TabVisibilityMixin` (`lib/screens/shell/`).
- Datas pro backend sempre em UTC (`toUtc().toIso8601String()`): o servidor
  (Vercel) interpreta ISO sem fuso como UTC.
- Médico no app: `DoctorRoomScreen` serve pra qualquer status; consulta
  agendada tem "Iniciar" (PATCH /status IN_PROGRESS — só o médico pode).
- Fila on-demand em produção: Asaas sandbox está configurado, mas o
  PAYMENT_MOCK está desligado — o Pix real aparece, a confirmação não
  chega sem pagar. A paciente do seed (maria) tem CPF inválido e o Asaas
  recusa; use um paciente com CPF válido.
- Dados de demonstração: `prisma/seed-demo.ts` no site (roda no build).
  Usuários `*@demo.emacrescere.app`, senha `Demo@12345`. Na aba Peso há
  "Carregar dados de exemplo" quando não há registros.
