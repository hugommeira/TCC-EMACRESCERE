# Diagnóstico do front-end — Emacrescere

Levantamento feito antes de qualquer mudança, seguindo a regra do projeto:
evoluir o que existe, sem trocar a arquitetura por estética.

## Stack encontrada

| Item | Versão / uso |
|---|---|
| Framework | Next.js 14.2 (App Router, `typedRoutes`) |
| UI | React 18, TypeScript `strict` |
| Estilo | Tailwind 3.4 + camada `@layer components` em `app/globals.css` |
| Tipografia | Fraunces (display) + Inter (texto), via `next/font` |
| Auth | NextAuth v5 (`lib/auth.ts`, `middleware.ts`), papéis PATIENT / DOCTOR / ADMIN / SUPER_ADMIN |
| Dados | Prisma + PostgreSQL (Neon); serviços em `services/api/*` |
| Tempo real | SSE (`hooks/useSSE.ts`, `lib/realtime.ts`), LiveKit para vídeo |
| Pagamento | Asaas (`services/external/asaas.ts`), R$ 150 fixo (`services/api/queue.ts`) |
| Validação | Zod em `lib/validations/*` |
| Testes | Vitest (46 testes em `lib/`) |
| Mobile | App Flutter em `mobile/`, APK servido em `public/app.apk` |

Estado global: não há store; sessão via NextAuth e dados por Server Components
e hooks. Isso é adequado ao tamanho atual e deve permanecer.

## O que está bom e deve permanecer

- Separação `app/` (rotas) / `components/<domínio>/` / `services/api` / `lib`.
  Domínios (`patient`, `doctor`, `consulta`, `queue`, `prescription`) já
  separam as experiências de paciente e médico.
- Primitivos em `components/ui` (Button, Input, Modal, Toast, ConfirmDialog).
- Landing como Server Components, com `"use client"` só onde há estado.
- Textos de conformidade (CFM 2.314/2022, ANVISA, LGPD) e a ressalva de que a
  plataforma não vende, indica nem dispensa medicamentos, repetidos nos pontos
  certos. Foram mantidos em todas as seções novas.
- Cuidados de mobile já existentes: alvos de toque de 44–52 px, barra de CTA
  fixa no celular, `<details>` nativo no rodapé.
- CSP restritiva em `next.config.mjs`.

## O que precisava ser corrigido (corrigido nesta etapa)

1. `--color-brand` em `globals.css` era `14 165 233` (azul sky-500), fora da
   marca verde. Agora é `16 185 129` (brand-500).
2. Nenhum tratamento de `prefers-reduced-motion`. Agora há uma regra global,
   e as revelações ao rolar nascem visíveis para quem pede menos movimento.
3. A escala `ink` não tinha 300/500/700; classes como `text-ink-500` não
   geravam CSS. Escala completada.
4. Texto secundário em `ink-400`/`slate-400` sobre branco tem contraste de
   ~3,4:1, abaixo do AA (4,5:1). A landing passou a usar `ink-500` (~5,6:1).
5. O link "Fale conosco" do bloco "Para quem" apontava para `#contato`, que não
   existe. O bloco foi refeito com CTAs reais (`/auth/register` e
   `/auth/register/medico`).
6. Os rótulos em caixa alta acima dos títulos e o degradê verde→teal em todo
   botão deixavam a página com cara de template. Os botões agora são sólidos
   (`brand-600`) e os rótulos ficaram em caixa normal.

## O que precisa ser corrigido (próximas etapas)

- **60 erros de TypeScript** pré-existentes, escondidos por
  `typescript.ignoreBuildErrors` em `next.config.mjs` (há um TODO lá). É o
  maior risco técnico do front: o build não pega regressões de tipo.
- O app (dashboards) usa a escala `gray`, a landing usa `slate`/`ink`, e o
  verde aparece como `brand`, `emerald` e `green` misturados (contagem:
  30× `bg-brand-50`, 22× `bg-emerald-50`, 8× `bg-emerald-500`...). Falta um
  conjunto de tokens semânticos (`surface`, `muted`, `accent`, `success`) para
  unificar as duas áreas.
- `components/ui/Button` existe, mas a landing e vários formulários montam
  botões à mão com classes longas. Convém um `buttonVariants()` compartilhado
  (mesma API do Button) para `<Link>` e `<a>`.

## O que deve ser refatorado (com benefício real)

- `components/consulta/PrescriptionPanel.tsx` (663 linhas),
  `ConsultationRoom.tsx` (432), `ConsultationDetailsModal.tsx` (408) e
  `auth/RegisterForm.tsx` (440) misturam busca, estado de formulário e
  apresentação. Separar hooks (`usePrescriptionDraft`, `useMedicationSearch`)
  dos componentes de apresentação reduz o risco de regressão na tela mais
  sensível do produto (prescrição).
- `hooks/useSSE.ts` e `lib/hooks/useSse.ts` são dois hooks de SSE com nomes
  quase iguais em pastas diferentes. Unificar.

## O que pode ser removido

- `.btn-*`, `.card`, `.badge-*` em `globals.css` duplicam `components/ui`.
  Remover depois de migrar os usos restantes.

## O que foi feito nesta etapa (área pública)

Referências estudadas: os sites enviados (VitalCare, Celltrion, SalvaMedic,
Medora, Synora), o modelo on-demand do Blis citado no TCC (seção 3.1.1), o
design system do NHS e a atualização do GOV.UK para WCAG 2.2 AA.

- **Hero**: título grande em Fraunces, foto real do projeto e a curva de
  evolução do peso se desenhando sobre ela, com os selos "CRM verificado" e
  "Receita com assinatura digital" e o cartão "Evolução do peso". É a única
  animação automática da página e representa uma função real do produto.
- **Faixa de confiança** com cinco garantias objetivas.
- **Trilho de cards com fotos** (substitui a grade de Benefícios, mesmo
  conteúdo), rolável por toque ou pelos botões.
- **Como funciona** em seção escura: é uma sequência real, então os números
  grandes se justificam; a linha de progresso e os números acendem ao entrar
  na tela.
- **Painéis Paciente / Médico** lado a lado com foto que se revela, deixando
  claro que são duas experiências diferentes, cada uma com seu cadastro.
- **CTA final** com o preço vindo de `CONSULTATION_FEE_REAIS`.
- Primitivos novos: `components/landing/motion/Reveal.tsx` (IntersectionObserver,
  dispara uma vez), `components/landing/Photo.tsx` (fallback de marca se a foto
  remota falhar) e `components/landing/photos.ts` (todas as fotos num lugar só,
  para trocar por fotos próprias).
- Animações só por CSS (sem biblioteca nova). Conteúdo nunca fica escondido
  sem JS: o estado inicial só vale com `html.js`.

Protótipo no Figma: arquivo "Emacrescere — Landing redesign", com a sequência
de entrada do hero animada (keyframes).

## Fora do escopo desta etapa

Autenticação, dashboards de paciente, médico e admin e a sala de consulta não
foram alterados. São as próximas frentes, nesta ordem sugerida: tokens
semânticos → telas de autenticação → painel do paciente → área do médico.
