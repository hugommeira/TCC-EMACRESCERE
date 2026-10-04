# Front-end — guia de continuação

Para quem (pessoa ou Claude Code local) for continuar a evolução do front-end
a partir da branch `claude/vigilant-thompson-mjo9k9`. O diagnóstico completo
está em [`frontend-diagnostico.md`](./frontend-diagnostico.md).

## Como trazer para a sua máquina

```bash
git fetch origin
git checkout claude/vigilant-thompson-mjo9k9
npm install
npx prisma generate   # o schema de peso/IMC exige client novo
npm run dev
```

A branch já contém a `main` atual (registro de peso/IMC e as correções de
build). Para publicar: abrir um pull request desta branch para a `main`.

**Nunca rode `prisma db push --accept-data-loss`.** Se o build reclamar de
perda de dados, é sinal de que uma branch com schema mais antigo está sendo
comparada com o banco; o certo é atualizar a branch com a `main`.

## O que já foi feito

| Frente | Arquivos principais |
|---|---|
| Landing (evolução do site atual) | `components/landing/*`, `app/page.tsx` |
| Motion e fotos | `components/landing/motion/Reveal.tsx`, `components/landing/Photo.tsx`, `components/landing/photos.ts` |
| Autenticação | `components/auth/AuthShell.tsx`, `app/auth/**/page.tsx` |
| Início do paciente | `app/dashboard/patient/page.tsx`, `components/patient/NextConsultation.tsx`, `components/patient/WeightSnapshot.tsx` |
| Bases | `app/globals.css` (reduced motion, `.reveal`), `tailwind.config.ts` (escala `ink`, keyframes) |
| Build | `package.json` (prévia não roda `db push`), `vercel.json` |

## Regras que o projeto segue (mantenha)

- A plataforma **não vende, indica nem dispensa medicamentos**; toda conduta
  é do médico. Nenhum texto pode prometer resultado, receita ou entrega.
- Paciente e médico são **experiências diferentes**: o médico usa o tom escuro
  (`ink-950`) nas telas próprias (ex.: `AuthShell variant="doctor"`).
- Identidade: degradê `brand-500 → teal-500` nos botões principais, Fraunces
  nos títulos, Inter no texto, fundo `brand-50` com manchas desfocadas.
- Animações só por CSS (`animate-rise`, `animate-draw`, `animate-float`,
  `<Reveal>`). Tudo respeita `prefers-reduced-motion` (regra global em
  `globals.css`). Uma orquestração por tela; o resto só reage ao usuário.
- Texto secundário em fundo branco: no mínimo `slate-500` / `ink-500`
  (contraste AA). `slate-400`/`ink-400` só para ícones decorativos.
- Fotos remotas sempre pelo `<Photo>` (tem fallback) e registradas em
  `photos.ts`; domínios novos precisam entrar no CSP e em
  `images.remotePatterns` (`next.config.mjs`).
- Textos de segurança só afirmam o que o código faz (ex.: link de senha vale
  15 min e é de uso único: `services/api/user.ts`).

## Próximas frentes sugeridas (nesta ordem)

1. **Área do médico** (`app/dashboard/doctor/page.tsx`): destacar as
   próximas consultas e pendências (certificado A1, perfil incompleto), no tom
   da área profissional. Reaproveitar o padrão de `NextConsultation`.
2. **Demais telas do paciente** (consultas, receitas, perfil): mesmo padrão de
   cartões `rounded-3xl` + `ring-slate-200` do novo início.
3. **Layout dos dashboards** (`components/layout/*`): sidebar e topbar ainda
   em `gray-*`; alinhar à paleta `slate`/`ink` e ao degradê da marca.
4. **Tokens semânticos** e um `buttonVariants()` compartilhado para `<Link>`,
   eliminando as classes longas repetidas de botão.
5. Dívida técnica: os 60 erros de TypeScript pré-existentes escondidos por
   `ignoreBuildErrors` (ver diagnóstico).

A branch `redesign-frontend` (prévia de design system do Hugo, não juntada)
tem ideias aproveitadas no início do paciente; ela parte de uma versão antiga
da `main` e depende de `lucide-react` e de tokens novos, então convém portar
ideias, não fazer merge direto.

## Como validar antes de enviar

```bash
npx tsc --noEmit | grep -c "error TS"   # não pode passar de 60
npx next lint --dir components --dir app
npx vitest run
```

## Login com Google/Facebook nas prévias da Vercel

O botão só aparece quando o build tem `GOOGLE_CLIENT_ID` e
`GOOGLE_CLIENT_SECRET` (idem `FACEBOOK_*`). Para funcionar numa prévia:

1. Vercel → Settings → Environment Variables: as chaves marcadas também em
   **Preview** (feito em 04/10/2026 para o Google).
2. Google Cloud Console → Credenciais → cliente OAuth → URIs de
   redirecionamento: o endereço **fixo da branch** (`tcc-emacrescere-git-…
   .vercel.app`) + `/api/auth/callback/google`. O endereço com código
   aleatório muda a cada deploy e o Google recusa.
3. `NEXTAUTH_URL` não pode estar em Preview apontando para o domínio de
   produção (o login voltaria para o site oficial).
4. Prévia só builda com `[preview]` na mensagem do commit (`vercel.json`).

## 3D e Blender (próxima frente visual)

> **Briefing completo dos assets 3D em [`docs/3d/`](./3d/BRIEFING.md)**
> (especificação de cada peça, exportação, orçamento de peso, andamento e o
> prompt pronto para o Claude local). O que está abaixo é o resumo.

Skills de Blender de [arjun988/blender-skills](https://github.com/arjun988/blender-skills)
(MIT, só Markdown) em `.claude/skills/`. Do pacote original (94 skills) ficaram
só as 15 úteis para os assets 3D do site, mais a pasta `references/`
(compartilhada): `blender-director`, `blender-modeler`, `hard-surface`,
`materials`, `texture-workflow`, `uv-workflow`, `lighting`, `rendering`,
`lookdev`, `camera-cinematography`, `compositing`, `animation` (girar o
logo, mover o celular), `asset-optimization`, `export-pipeline` e
`qa-review`. O resto (terror, estilos de jogo, gêneros, personagens,
exportação para Unity/Unreal/Godot) saiu; para recuperar alguma, copie-a de
`arjun988/blender-skills/.claude/skills/`. As skills `stylized-style` e
`realistic-style` também saíram (dois trechos de `materials` e `references/`
foram ajustados para não apontar para elas).

Elas mandam o Claude operar o Blender por MCP, então só rendem no PC com o
Blender aberto. O `.mcp.json` do repositório de origem **não** foi copiado de
propósito: ele roda programas de terceiros sozinho (`uvx blender-mcp`). Ligue
você mesmo:

1. Instalar o Blender 3.0+ e o `uv`.
2. No Blender: Edit → Preferences → Add-ons → Install, escolher o `addon.py`
   de [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) e
   ativar. Na barra lateral (N), aba BlenderMCP, clicar em "Connect".
3. No terminal do projeto: `claude mcp add blender -- uvx blender-mcp`.

### 3D no site (feito)

Os 3 primeiros assets (logo, celular, selo) já estão ligados:

| Onde | Componente | Asset |
|---|---|---|
| Painel escuro das telas de login/cadastro/senha | `components/auth/AuthShell.tsx` | `logo-heart` (decorativo, canto superior) |
| Hero da landing, desktop | `components/landing/Hero.tsx` (`HeroVisual`) | `phone-app` com as 5 telas trocando |
| "Para médicos" | `components/landing/ForDoctors.tsx` | `seal-signature` sobre a foto |

- **`components/three/Scene3D.tsx`**: moldura de qualquer asset. Mostra o
  poster (`public/3d/posters/*.webp`) e só baixa o three.js (chunk separado)
  quando a moldura chega perto da tela; pausa fora dela. Fica só no poster
  com tela < 1024 px, movimento reduzido, economia de dados, sem WebGL ou
  se o modelo falhar.
- **`components/three/Stage.tsx`**: as cenas (`logo`, `phone`, `seal`), luz
  montada na hora (sem CDN) e o movimento (balanço + mouse; as telas do
  celular trocam a cada 3,2 s; o check do selo pulsa a cada 4,5 s).
- **Telas do celular:** `public/3d/screens/tela-1..5.webp` (1040×2160):
  Agendar, Pagamento, Videochamada, Receita, Peso. Dados fictícios.
- **Segurança (`next.config.mjs`):** `'wasm-unsafe-eval'` em `script-src`
  (decodificador meshopt é WASM) e `blob:` em `connect-src` (texturas
  embutidas no `.glb`). **`middleware.ts`** libera a extensão `.glb` (antes
  os modelos caíam no redirect de login).
- **Para adicionar um asset:** `.glb` em `public/3d/`, poster em
  `public/3d/posters/`, nova cena em `Stage.tsx` e `<Scene3D scene=… />`.
  Uma cena ao vivo por tela.

### Plano de 3D sem pesar no site

- **Orçamento:** no máximo **1 cena WebGL ao vivo** por tela; o resto é
  CSS 3D ou imagem/vídeo pré-renderizado no Blender. Modelo `.glb` abaixo de
  1–2 MB (Draco/meshopt), carregado só quando aparece na tela. No celular,
  imagem ou vídeo leve no lugar do WebGL.
- **Mesma cena, mesma luz:** todos os objetos no mesmo arquivo do Blender,
  com materiais nas cores da marca (`brand-500`, `teal-500`, branco,
  `ink-950`), para o conjunto parecer coeso.
- **Ordem sugerida:** (1) logo 3D (coração com pessoa e folha) nas telas de
  login; (2) celular 3D com as telas do roteiro do Figma ("Celular animado");
  (3) selo de assinatura digital em "Para médicos"; os itens (4) mini-3D
  nos passos e (5) animação da fila foram descartados (ver `docs/3d/ASSETS.md`).
- **Não fazer:** 3D em gráfico de peso/IMC ou receita (clareza dos dados);
  cápsulas, canetas ou frascos (a plataforma não vende nem indica remédio);
  corpo humano realista; logo do Android (marca registrada).
- **Cuidados de código:** Next 14 + React 18 → `@react-three/fiber` v8.
  O CSP (`next.config.mjs`) bloqueia scripts externos: os modelos usam
  meshopt (sem Draco, nada de CDN); o CSP já libera o que ele precisa. Respeitar `prefers-reduced-motion`, ter
  imagem de reserva sem WebGL e pausar a cena fora da tela.
