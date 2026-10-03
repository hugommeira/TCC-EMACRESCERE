# Assets 3D — especificação de cada peça

Convenções gerais (nomes, exportação, peso) em [`EXPORT.md`](./EXPORT.md).
Cores em [`BRIEFING.md`](./BRIEFING.md), seção 7.
Unidade do Blender: **metros**, escala 1. O site normaliza o tamanho por
código, mas as proporções reais têm de estar certas.

Todo asset com `.glb` entrega também um **poster** (imagem WebP transparente)
tirado da pose inicial. Ele aparece no celular, sem WebGL e enquanto o modelo
carrega. **Câmera do poster:** perspectiva, campo de visão 45°, objeto
centralizado ocupando ~80% da altura, giro de 15° e inclinação de 8°.
Fundo transparente (Film → Transparent), sem sombra projetada no chão.

---

## 1. `logo-heart` — logo da marca em 3D (prioridade 1)

**Onde:** painel lateral das telas de login, cadastro, cadastro de médico e
recuperar/redefinir senha (fundo verde-escuro, `#064E3B` → `#070B18`).
**Comportamento no site:** oscila ±25° para os lados e flutua devagar.

**Forma:** o símbolo do **logo oficial** (ver `BRIEFING.md`, seção 6;
arquivo `reference/logo-oficial.png`), com o volume de fita do laço.
- Largura total **0,20 m**. Espessura: **0,03 m** na fita do laço, **0,022 m**
  na folha e no braço, e a cabeça como esfera levemente achatada (0,036 m de
  diâmetro). Chanfro de ~0,004 m com 2 segmentos.
- A figura inteira fica **centralizada** na origem, frente para `-Y`.

**Peças (objetos separados, para animar em código):**

| Objeto | Conteúdo | Material |
|---|---|---|
| `Logo_Body` | corpo: braços, laço oval e ponta em "V" | `MAT_Logo_Body` |
| `Logo_Leaf` | a folha do lado direito | `MAT_Logo_Leaf` |
| `Logo_Head` | a cabeça (esfera achatada) | `MAT_Logo_Head` |

**Materiais:** acabamento levemente brilhante, mas sem espelhar
(rugosidade 0,35–0,40, metálico 0).
- O logo oficial tem **degradê** de verde profundo (esquerda e embaixo) para
  verde-limão claro (alto à direita). Reproduza com **cor de vértice** (o
  caminho mais leve) ou textura 256×256. Nós de shader procedurais **não
  exportam** para glTF.
- Cores-base: amostre do logo oficial. Se faltar, comece por `#059669`
  (parte escura) e `#10B981` (parte média), e informe o usuário.
- `MAT_Logo_Body`, `MAT_Logo_Leaf` e `MAT_Logo_Head` podem compartilhar o
  mesmo material se o degradê vier de cor de vértice (melhor para o peso).

**Orçamento:** ≤ 8.000 triângulos; `.glb` ≤ 150 KB.
**Entrega:** `public/3d/logo-heart.glb`, `public/3d/posters/logo-heart.webp`
(1200×1200, ≤ 90 KB) e `public/3d/posters/logo-heart@1x.webp` (600×600).
**Pronto quando:** silhueta idêntica ao logo oficial (sobrepor a captura
frontal a `logo-oficial.png`), bordas lisas, volume de fita visível no laço,
degradê parecido com o original e sem serrilhado.

---

## 2. `phone-app` — celular com a tela do app (prioridade 2)

**Onde:** topo da página inicial, no computador.
**Comportamento no site:** inclina com o mouse e com a rolagem; a tela troca
de imagem por código (5 telas, ver `reference/roteiro-5-telas.png`).

**Medidas (proporção do quadro do Figma, 280×560):**
- Corpo **0,072 × 0,144 × 0,008 m**, cantos arredondados de **0,0113 m**.
- Área da tela **0,0669 × 0,1389 m**, cantos de **0,0087 m**, rente ao vidro.
- Ilha de câmera (pílula) **0,021 × 0,0055 m**, a 0,0015 m do topo.
- Botões laterais discretos (volume e energia), sem marca.

**Peças:**

| Objeto | Conteúdo | Material |
|---|---|---|
| `Phone_Body` | moldura e traseira | `MAT_Phone_Body` (`#0B1220`, rugosidade 0,3, metálico 0,6) |
| `Phone_Screen` | plano da tela | `MAT_Screen` |
| `Phone_Island` | pílula da câmera | `MAT_Phone_Black` (`#000000`) |
| `Phone_Buttons` | botões laterais | `MAT_Phone_Body` |

**`Phone_Screen` (importante para o código):**
- Um único plano com **UV de 0 a 1 cobrindo toda a tela**. Vista de frente, a
  imagem fica em pé: U cresce para a direita, V cresce para cima.
- `MAT_Screen` usa **só emissão** (cor base preta; textura na emissão com
  força 1). Coloque como textura provisória uma das telas de
  `reference/screens/`. **O site troca a textura por código**; as definitivas
  (1040×2160) serão fornecidas pela nuvem em `public/3d/screens/`.
- Não crie os 5 materiais de tela; só o `MAT_Screen`.

**Orçamento:** ≤ 20.000 triângulos; `.glb` ≤ 350 KB (sem a textura da tela
embutida, ou com ela em ≤ 100 KB).
**Entrega:** `public/3d/phone-app.glb`, `public/3d/posters/phone-app.webp`
(900×1800, ≤ 140 KB) e `phone-app@1x.webp` (450×900).
**Pronto quando:** de frente, a tela preenche o retângulo certo sem faixa de
cor ao redor; bordas do corpo suaves; sem marca nenhuma.

---

## 3. `seal-signature` — selo de assinatura digital (prioridade 3)

**Onde:** seção "Para médicos" (fundo `#070B18`).
**Sentido:** representa "receita assinada digitalmente (ICP-Brasil)".
**Comportamento no site:** gira devagar; o `Seal_Check` aparece com um pulo.

**Forma:** medalha redonda de **0,10 m** de diâmetro e **0,012 m** de
espessura, borda recortada em **14 lóbulos** suaves, um escudo em relevo no
centro e um **check** no escudo. **Sem texto** (texto 3D pesa e envelhece).

| Objeto | Conteúdo | Material |
|---|---|---|
| `Seal_Disc` | disco com borda recortada | `MAT_Seal_Disc` (`#10B981`, rugosidade 0,3) |
| `Seal_Ring` | anel fino em relevo | `MAT_Seal_Ring` (`#2DD4BF`, rugosidade 0,25) |
| `Seal_Shield` | escudo central | `MAT_Seal_Shield` (`#064E3B`) |
| `Seal_Check` | check extrudado | `MAT_Seal_Check` (`#FFFFFF`, rugosidade 0,3) |

**Orçamento:** ≤ 10.000 triângulos; `.glb` ≤ 200 KB.
**Entrega:** `public/3d/seal-signature.glb`,
`public/3d/posters/seal-signature.webp` (1000×1000, ≤ 80 KB) e `@1x`.
**Pronto quando:** o check é legível a 64 px; o conjunto parece "selo oficial",
não "medalha de esporte".

---

## 4. `step-*` — quatro ícones do "Como funciona" (prioridade 4)

**Onde:** cada um dentro do cartão de um passo (ícone de ~96 px). **Só imagem.**

| Arquivo | Passo | Objeto |
|---|---|---|
| `step-profile` | Preencha seu perfil | prancheta com 3 linhas e um check |
| `step-consult` | Consulte um médico | janela de videochamada com um balão |
| `step-follow` | Acompanhamento contínuo | balão de chat com um minigráfico descendo |
| `step-pharmacy` | Dispensação em farmácia | fachada de loja com **cruz verde** |

- **Sem comprimidos, caixas de remédio ou frascos** (`BRIEFING.md`, seção 3).
  A farmácia é só uma fachada com toldo e a cruz.
- Mesma cena do Blender, mesma luz e mesmo ângulo nos quatro (giro 20°,
  inclinação 15°). Estilo "ilustração 3D": cantos arredondados, materiais
  fosco-brilhantes nas cores da marca.
- Sombra de contato leve **sob** o objeto (cabe na imagem, fundo transparente).

**Entrega:** `public/3d/steps/<arquivo>.webp` (512×512, transparente,
≤ 40 KB) e `<arquivo>@1x.webp` (256×256).
**Pronto quando:** os quatro parecem da mesma família e se distinguem a 48 px.

---

## 5. `queue-hourglass` — espera na fila (prioridade 5)

**Onde:** tela em que o paciente espera o médico. **Imagem animada.**
**Objeto:** ampulheta de vidro com areia `#10B981` e base `#064E3B`. A
areia cai de forma contínua; no fim o quadro volta ao início sem salto.

**Entrega:** `public/3d/queue-hourglass-loop.webp` (WebP **animado**,
320×320, transparente, 24 quadros/s, 2 s de duração, ≤ 300 KB) e
`public/3d/queue-hourglass.webp` (parada, ≤ 30 KB).
**Alternativa se o peso passar de 300 KB:** usar o coração do logo pulsando
(o `logo-heart.glb` anima por código) e dispensar este asset. **Avise o
usuário antes de trocar.**

---

## Extras (só se o usuário pedir)

- Coração e folha soltos, flutuando na chamada final (`float-heart`,
  `float-leaf`, ≤ 3.000 triângulos cada).
- Selo "pagamento confirmado" (`seal-paid`), igual ao `seal-signature` mas com
  cifrão em vez do escudo.
