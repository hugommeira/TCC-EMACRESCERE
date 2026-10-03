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
6. Textos em `slate-400` sobre branco na landing passaram para `slate-500`
   pelo mesmo motivo de contraste.

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

Direção: evoluir o site atual, sem trocar a identidade. Ficaram o degradê
verde→teal dos botões, o título com "saúde metabólica" em degradê, o fundo
verde-claro com manchas desfocadas, o cartão "Emacrescere ao vivo", o selo
de CRM, os cards com ícone e o CTA final em degradê.

- **Hero**: entrada animada em sequência; os itens do cartão "ao vivo"
  aparecem um a um; a curva de evolução do peso se desenha sobre a foto; o
  selo de CRM flutua devagar; o degradê do título tem um brilho lento.
- **Como funciona**: os mesmos 4 cards, com entrada escalonada ao rolar e
  faixa de cor no hover.
- **Benefícios**: os 6 cards com ícone ganharam uma coluna de foto ao lado
  (mosaico) e o ícone acende no hover.
- **Para quem**: foto em alta resolução que se revela ao rolar; o link
  quebrado `#contato` virou o cadastro de médicos.
- **Para médicos** (bloco novo): a área profissional como experiência
  própria (fila, prontuário, prescrição ANVISA, certificado A1).
- **Cabeçalho**: link "Para médicos" e barra de progresso de leitura.
- Fotos do Pexels (licença livre) centralizadas em
  `components/landing/photos.ts`, com fallback de marca.
- Primitivos: `components/landing/motion/Reveal.tsx` e
  `components/landing/Photo.tsx`. Animações só por CSS, sem biblioteca nova;
  com `prefers-reduced-motion` tudo nasce parado e visível.

## Fora do escopo desta etapa

Autenticação, dashboards de paciente, médico e admin e a sala de consulta não
foram alterados. São as próximas frentes, nesta ordem sugerida: tokens
semânticos → telas de autenticação → painel do paciente → área do médico.
