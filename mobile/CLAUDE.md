# CLAUDE.md — Emacrescere App (Paciente)

## Sobre o projeto
Emacrescere é uma plataforma de telemedicina com consulta agendada para
acompanhamento de tratamento de emagrecimento. Esta pasta (`mobile/`) é o APP MOBILE, com as
interfaces de PACIENTE e de MÉDICO (a do médico entrou em 2026-09-11). O
administrador ("farmácia") usa apenas o site web (Next.js, a raiz deste mesmo
repositório), que também é o backend de tudo.

## Onde o app mora (decisão de 2026-10-03)
- O app vive em `mobile/`, dentro do repo do site
  (github.com/hugommeira/TCC-EMACRESCERE). **Edite aqui.** Commit e branch são
  os mesmos do site; regras de git/deploy no `CLAUDE.md` da raiz.
- `C:\Users\jujuj\emacrescere_app` é arquivo morto local (o histórico do app
  até as frentes A, B e C, commit `0ef4978`). Não editar, não apagar, não
  sincronizar. Não existe mais subtree nem o remote `flutter-mobile`.
- O app não precisa de `.env` (desde 2026-10-04 ele não é mais asset do
  `pubspec.yaml`). A `API_BASE_URL` padrão é a produção,
  `https://tcc-emacrescere.vercel.app`, fixada em `ApiClient`
  (`String.fromEnvironment`); outro servidor: `--dart-define=API_BASE_URL=...`.
  Na web a API é a origem da página (ou o proxy de dev em localhost). O
  `tool/dev_web.dart` ainda lê `API_BASE_URL` de um `mobile/.env` se ele
  existir (git-ignorado). O pacote `flutter_dotenv` ficou no `pubspec.yaml`
  sem uso, a remover.

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

## Escopo: a fila on-demand está ESCONDIDA
`lib/constants.dart` tem `kQueueEnabled = false`, espelhando `QUEUE_ENABLED`
em `lib/constants.ts` no site. Nesta entrega o atendimento é só por
agendamento; a fila virou trabalho futuro (TCC, seção 5.5.1).

Nada foi apagado — `screens/consultations/queue/*`,
`screens/doctor/doctor_queue_screen.dart`, `services/queue_service.dart` e os
campos do modelo continuam aqui, e `test/queue_screens_test.dart` continua
rodando. A chave só esconde os pontos de entrada: a aba "Fila" do médico sai
da NavigationBar, "Nova consulta" do paciente abre o agendamento, e os textos
que falavam de fila mudam. Pra reativar, troque para true nos dois lados — as
duas pontas precisam concordar, senão o app oferece uma fila que o backend
esconde.

A chave é `final` e não `const` de propósito: constante de compilação faria o
analisador marcar como `dead_code` justamente o código que queremos preservar.

## Escopo do app (paciente) — estado em 2026-09-11
- Cadastro/login — feito (NextAuth Credentials via API)
- Escolha/compra de plano de acompanhamento (Asaas) — não existe no
  backend (só cobrança por consulta); compra fica no site
- Entrar na fila de atendimento — ESCONDIDO (`kQueueEnabled`). O código
  continua: POST /api/queue/enter com Pix/boleto, tela de pagamento, espera
  com heartbeat, sala com chat.
- Agendar com médico específico — feito, com pagamento desde 03/10/2026.
  Os horários vêm de GET /api/doctors/:id/slots (a agenda que o médico
  configurou), não mais de uma lista fixa no app, e o `startsAt` devolvido
  pelo servidor é o que volta no POST /api/consultations — não a hora montada
  no celular. 409 = outro paciente pegou o horário: volta pra agenda
  recarregada. Depois de marcar, POST /api/checkout gera a cobrança (Pix ou
  boleto; o valor é decidido pelo servidor, o app não manda `amount`).
  Cartão de crédito não (exige número, validade, CCV e endereço do titular,
  que o app não coleta) — há botão pra pagar no site.
  "Simular pagamento" só funciona com PAYMENT_MOCK=true no servidor —
  em produção hoje está DESLIGADO (o /api/dev/simulate-payment responde 404).
- Chat com o médico — feito (polling 5s; backend tem SSE se quiser trocar)
- Videochamada com o médico (LiveKit) — NÃO feito; sala mostra banner
- Visualizar/baixar prescrições digitais — feito (PDF só nativo)
- Histórico de atendimentos — feito
- Acompanhamento de peso/IMC — feito e NO SERVIDOR desde 03/10/2026.
  GET/POST /api/weight, DELETE /api/weight/[id] e PATCH /api/patient/metrics
  (altura e meta). O IMC vem calculado do backend (lib/bmi.ts do site), a
  partir do peso e da altura do perfil — o app NÃO recalcula, pra não
  divergir do site. O gráfico tem filtro de período (30d, 3m, 6m, 1a, tudo)
  e alterna entre peso e IMC. O SharedPreferences saiu: quem tinha dados só
  no aparelho começa do zero.

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
- DoctorShell: Consultas (GET /api/consultations, que pra DOCTOR devolve as
  dele), Agenda (AgendaScreen, a tela reservada pro médico) e Perfil
  (GET/PATCH /api/doctor/profile, switch "disponível"). A aba Fila (GET
  /api/queue/list, polling 8s; Atender = POST /api/queue/claim) só aparece
  com `kQueueEnabled`. O índice da NavigationBar é a posição na lista de abas
  visíveis, NÃO `DoctorTab.index` — o enum continua contando a fila.
- DoctorRoomScreen: botão de balança na AppBar abre a evolução de peso do
  paciente (PatientWeightSheet) e deixa registrar o peso aferido, já
  vinculado à consulta. O backend recusa (403) se o médico não atende esse
  paciente.
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

Ícone do app e tela de abertura (2026-09-16): PNGs em `assets/icon/`
rasterizados do `mark.svg` com o degradê da marca (azulejo = ícone
clássico; fundo + símbolo separados = ícone adaptativo do Android 8+).
Gerados por `flutter_launcher_icons` e `flutter_native_splash` (config no
fim do `pubspec.yaml`). Se o símbolo mudar: refazer os PNGs e rodar
`dart run flutter_launcher_icons` e `dart run flutter_native_splash:create`.
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

### Tema claro e escuro (2026-10-04)
- `AppTheme.light` e `AppTheme.dark` saem do mesmo construtor; a diferença
  está na `AppPalette` (ThemeExtension em `lib/theme/app_theme.dart`).
- **Em tela, cor vem de `context.colors.<nome>`**, não de `AppColors`. Os
  nomes são os mesmos (`gray600`, `brand100`, `ink`, `card`...), mas no
  escuro os tons claros da escala viram fundos/bordas escuros e os tons
  escuros viram texto claro. `AppColors` fica só para o que não muda com o
  tema: degradês, fundo esmeralda com texto branco (botão, bolha do chat,
  dia selecionado), texto branco sobre o header verde.
- `ThemeController` (`lib/theme/theme_controller.dart`) guarda a escolha no
  SharedPreferences, separada por perfil: paciente começa no claro, médico
  no escuro (experiências diferentes). O `StartupGate` informa o perfil.
- Para trocar: botão sol/lua no header verde (`ThemeToggleButton`) ou o
  cartão "Tema escuro" no Perfil (`ThemeSettingCard`).

### Telas do redesenho (2026-10-04) — idênticas ao canvas
O canvas "Emacrescere App — Redesign" (artifact no claude.ai) é a referência
visual. Seis telas seguem as pranchetas: boas-vindas/onboarding
(`widgets/welcome_carousel.dart`), Início da paciente
(`home/dashboard_screen.dart`), Peso (`tracking/tracking_screen.dart`),
Agendar (`consultations/schedule/schedule_screen.dart`), Consulta e receita
(`consultations/consultation_detail_screen.dart`, abas Resumo/Receita/Chat)
e Início da médica (`doctor/doctor_consultations_screen.dart`).
- Cores dessas telas: `context.ds` (`DesignTokens`, os mesmos nomes das
  variáveis CSS das pranchetas). Fontes: Fraunces (títulos/números,
  `AppType.title`) e Inter (texto), embutidas em `assets/fonts/` (OFL).
- Componentes em `lib/widgets/ui.dart`: `ThemeToggle`, `DsCard`,
  `PillSegmented`, `ShineButton`, `GlassNavBar` (barra flutuante; os shells
  usam `extendBody: true`, então o conteúdo soma
  `MediaQuery.paddingOf(context).bottom` no fim da lista), `IconTile`,
  `DsChip`, `InitialsTile`, `DriftBlob`, `PulseDot`.
- Diferenças conscientes da prancheta: o seletor Peso/IMC do gráfico e o
  "1 ano" saíram (a prancheta tem só 30 dias/3 meses/6 meses/Tudo); altura e
  meta abrem tocando no cartão do anel; apagar pesagem é toque longo ou
  arrastar a linha; o sino do Início abre o Chat e só pulsa com consulta em
  até 24 h (não há notificações no app); "Validar" abre `/prescricao/<id>`
  no site, o mesmo link do PDF.

### Movimento e 3D (2026-10-04) — `lib/widgets/motion.dart`
- `assets/3d/*.webp` são os renders dos modelos 3D do site
  (`public/3d/posters/*@1x.webp`); o app não carrega `.glb`.
- `FloatingLogo3D` (coração-folha flutuando com sombra no chão: boas-vindas e
  onboarding), `Seal3D` (selo girando: receita assinada no detalhe da
  consulta) e `Rise` (entrada dos blocos, aplicada no
  `CurvedHeaderScaffold`). Todos param quando o sistema pede menos
  animação, e `Rise` não usa opacidade (nada fica invisível).
- Números de peso/IMC com vírgula: `formatDecimal` em `lib/utils/formatters.dart`.

## Como rodar / testar
- Flutter 3.47.x / Dart 3.13 (o `pubspec.lock` atual não resolve em versões
  anteriores; `flutter --version` pra conferir)
- `flutter pub get` antes de rodar
- **Modo demonstração (sem servidor):** `flutter build web --release
  --no-web-resources-cdn --dart-define=DEMO_API=true` gera um app que
  responde a API sozinho com dados de exemplo (`lib/services/demo_api.dart`)
  e mostra a faixa "DEMO". Serve para publicar uma prévia navegável; o app
  normal (sem o define) nunca usa. Contas: mariana.castro@email.com e
  fernanda.costa@demo.emacrescere.app, senha Demo@12345.
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
- `API_BASE_URL` padrão é o backend em produção
  (`https://tcc-emacrescere.vercel.app`), sem `.env`; para outro servidor,
  `--dart-define=API_BASE_URL=...`
- Testes automatizados: `flutter test` — widget tests de layout das telas
  de fila/pagamento (`test/queue_screens_test.dart`) e do cadastro/
  credenciamento do médico (`test/doctor_screens_test.dart`) e dos temas
  claro/escuro (`test/theme_test.dart`), 320px de largura, sem rede. Rode antes de commitar mudanças de UI.

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
web em localhost (ou 127.0.0.1) o `ApiClient` aponta pro proxy local
`http://localhost:8080`
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
- Fora de localhost (a versão publicada em `/app/` do site) a API e o
  `siteUrl` são a origem da própria página: mesma origem, sem CORS e sem
  proxy.

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
- Pagamento em produção: Asaas sandbox está configurado, mas o
  PAYMENT_MOCK está desligado — o Pix de sandbox aparece, e a confirmação só
  chega quando a cobrança é confirmada no painel do Asaas Sandbox. A paciente do seed (maria) tem CPF inválido e o Asaas
  recusa; use um paciente com CPF válido.
- Dados de demonstração: `prisma/seed-demo.ts` no site (roda no build).
  Usuários `*@demo.emacrescere.app`, senha `Demo@12345`. Na aba Peso há
  "Carregar dados de exemplo" quando não há registros.
