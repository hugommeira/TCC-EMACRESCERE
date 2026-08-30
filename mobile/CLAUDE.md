# CLAUDE.md — Emacrescere App (Paciente)

## Sobre o projeto
Emacrescere é uma plataforma de telemedicina on-demand para acompanhamento de
tratamento de emagrecimento. Este repositório é o APP MOBILE, exclusivo para o
PACIENTE. Médico e administrador usam apenas o site web (Next.js), que é outro
repositório/projeto.

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

## Escopo do app (paciente)
- Cadastro/login
- Escolha/compra de plano de acompanhamento (Asaas)
- Entrar na fila de atendimento
- Chat em tempo real com o médico
- Videochamada com o médico (LiveKit)
- Visualizar/baixar prescrições digitais
- Histórico de atendimentos
- Acompanhamento contínuo pós-compra (área liberada só após login + plano ativo)

## Fora de escopo
- Qualquer tela de médico ou administrador (fica só no site)
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

## Como rodar / testar
- Flutter 3.38.5 / Dart 3.10.4 (`flutter --version` pra conferir)
- `flutter pub get` antes de rodar
- `flutter run -d <device-id>` — use `flutter devices` pra listar (Android
  físico ou emulador; Windows/Chrome não valem pra testar auth de verdade,
  ver nota de CORS/cookie abaixo)
- `API_BASE_URL` já configurada em `.env` (git-ignorado), apontando pro
  backend em produção: `https://tcc-emacrescere.vercel.app`
- Testes automatizados: nenhum ainda além do `test/widget_test.dart` padrão
  do template (desatualizado, ainda testa o counter)

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
Chrome/Edge (Flutter Web), o navegador aplica CORS e regras de cookie
`SameSite` que podem bloquear o cookie de sessão silenciosamente — prefira
sempre um device nativo pra testar autenticação.
