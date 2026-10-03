# Briefing — assets 3D do site Emacrescere

> **Para o Claude Code local.** Leia este arquivo inteiro antes de abrir o
> Blender. Os detalhes de cada asset estão em [`ASSETS.md`](./ASSETS.md), as
> regras de exportação em [`EXPORT.md`](./EXPORT.md) e o andamento em
> [`STATUS.md`](./STATUS.md). Imagens de referência em
> [`reference/`](./reference/).

## 1. Missão

Criar os modelos 3D e as imagens pré-renderizadas que enfeitam a página
inicial e as telas de login do site **Emacrescere**, uma plataforma de
telessaúde para acompanhamento médico de obesidade e doenças metabólicas.

O 3D é **acabamento de marca**: deve passar confiança, cuidado e tecnologia,
sem pesar no site e sem parecer propaganda de remédio.

**Você faz a arte (Blender). Outro agente (na nuvem) faz o código do site.**
Os dois se encontram nos arquivos de `public/3d/`. Não escreva componentes
React, não mexa em `app/`, `components/`, `next.config.mjs` nem em
`package.json`. Isso evita conflito.

## 2. Contexto do produto (o mínimo para decidir bem)

- **Quem usa:** pacientes (pessoas com sobrepeso/obesidade, muitas com
  histórico de dietas frustradas) e médicos. Público brasileiro, em maioria
  no celular.
- **O que o site faz:** o paciente cria conta, agenda ou entra na fila, paga
  (Pix, cartão, boleto), consulta por vídeo, recebe receita assinada
  digitalmente (se o médico indicar) e acompanha o peso. O médico tem uma
  área profissional separada.
- **Tom visual:** acolhedor, limpo, tecnológico, confiável. Verde-esmeralda
  e verde-azulado sobre branco, com seções escuras em azul-noite.
  Tipografia do site: Fraunces (títulos, serifada) e Inter (texto).
- **Stack do site:** Next.js 14, React 18, Tailwind. O 3D será exibido com
  `@react-three/fiber` v8 (WebGL) ou como imagem (celular). Por isso os
  arquivos precisam ser **pequenos e limpos**.

## 3. Regras que não se negociam

1. **Nada de medicamento.** A plataforma não vende, indica nem dispensa
   remédio. Proibido: cápsulas, comprimidos, canetas injetáveis, frascos,
   seringas, caixas de remédio. Isto vale até para "decoração".
2. **Nada de corpo humano realista** (estigmatiza). Se precisar de figura
   humana, só abstrata, como a do logo.
3. **Nada de marcas de terceiros:** sem logo do Android, da Apple, do Pix ou
   de bancos. O celular é genérico, sem marca. A tela mostra só "Emacrescere".
4. **Dados de exemplo apenas.** O médico das telas é fictício
   ("Dr(a). Carlos Lima"). Não invente números clínicos novos; use os que
   estão nas telas de referência.
5. **Sem promessa de resultado** em nenhum texto que apareça no 3D.
6. **Peso importa mais que beleza extra.** Se um detalhe estoura o orçamento
   de [`EXPORT.md`](./EXPORT.md), corte o detalhe.
7. **O logo é a marca:** não redesenhe a silhueta. Refazer as curvas com
   limpeza é obrigatório (ver seção 6), mudar o desenho não.

## 4. Como trabalhar (passo a passo)

1. **Conecte o Blender** (veja `docs/frontend-handoff.md`, seção "3D e
   Blender"). Confirme que o MCP responde antes de começar.
2. **Comece pela skill `blender-director`** e siga a ordem da seção 5.
3. **Um asset por vez.** Para cada um: modelar → materiais → luz → câmera →
   `lookdev` (compare capturas até a aparência fechar) → `asset-optimization`
   → `export-pipeline` → `qa-review`.
4. **Pare e mostre ao usuário** ao fim de cada asset, com:
   - 3 capturas (frente, 3/4 e costas) sobre fundo claro **e** sobre o fundo
     escuro `#070B18`;
   - os números: triângulos, nº de materiais, tamanho do `.glb` em KB;
   - a lista de arquivos entregues.
   Só siga para o próximo depois do "aprovado" do usuário.
5. **Salve o `.blend` de trabalho** em `art/3d-src/` (nome igual ao asset).
   Se passar de 10 MB, não suba para o git; avise.
6. **Registre o andamento** em [`STATUS.md`](./STATUS.md) (marque as caixas).
7. **Commit pequeno por asset**, só com arquivos de `public/3d/`,
   `art/3d-src/` e `docs/3d/STATUS.md`. Trabalhe numa branch `3d-assets`
   criada a partir de `claude/vigilant-thompson-mjo9k9`.

## 5. Ordem de entrega (prioridade)

| # | Asset | Onde aparece | Tipo |
|---|---|---|---|
| 1 | `logo-heart` | Painel lateral do login, cadastro e recuperar senha | GLB + poster |
| 2 | `phone-app` | Topo da página inicial (computador) | GLB + poster |
| 3 | `seal-signature` | Seção "Para médicos" | GLB + poster |
| 4 | `step-*` (4 ícones) | "Como funciona" | só imagens |
| 5 | `queue-hourglass` | Tela de fila de espera | imagens em sequência |

Detalhes, medidas e critérios de pronto de cada um estão em
[`ASSETS.md`](./ASSETS.md). **Faça o 1 primeiro:** ele valida o fluxo todo
(modelo, materiais, exportação, tamanho) com o asset mais simples.

## 6. O logo: atenção especial

**Referência principal: o logo oficial, que o usuário enviou como imagem**
(círculo claro com o símbolo e a palavra "Emacrescere"). O usuário deve
salvá-lo em `docs/3d/reference/logo-oficial.png` **antes de você começar**.
Se o arquivo não estiver lá, **peça-o ao usuário**: não improvise a partir do
SVG do site.

**Como o símbolo é (descrição, para conferir contra a imagem):**
- Um **coração formado por uma figura humana estilizada**.
- **Cabeça:** uma esfera no alto, ao centro, com degradê claro (mais clara no
  canto superior direito).
- **Lado esquerdo do coração:** uma **fita em laço oval**, com espessura e
  dobra visíveis, como um anel torcido. O interior da fita é verde mais
  escuro; a borda externa, mais clara.
- **Lado direito do coração:** uma **folha** grande com a nervura central
  marcada por um corte, e um **braço em curva** que sai da cabeça, passa por
  cima da folha e termina em ponta enrolada.
- **Embaixo:** as duas partes se encontram numa **ponta em "V"**, com uma
  pequena dobra.
- **Cores:** degradê de **verde profundo** (esquerda e parte de baixo) para
  **verde-limão claro** (alto à direita), em tons suaves, sem contorno.
- A palavra "Emacrescere" (serifada, com uma folha na letra E), o círculo ao
  redor e o filete com duas folhinhas **não entram no 3D**. O site já escreve a
  palavra em texto.

**Cores do logo oficial:** as do degradê acima são apenas descritas, não
medidas. **Amostre as cores direto da imagem** (conta-gotas) e anote os hex
em `STATUS.md`. O verde da interface do site continua sendo `#10B981`.

**Regras de modelagem:**
- Reproduza a silhueta e o **volume de fita** do laço; não achate o logo.
- Poucos pontos de Bézier, borda lisa. Sobreponha a captura frontal à imagem
  oficial para conferir.
- O laço esquerdo tem espessura maior que a cabeça e a folha; mantenha essa
  hierarquia de volumes.

**Referência secundária (só para o contorno):**
[`reference/logo-heart.svg`](./reference/logo-heart.svg) e
[`reference/logo-heart.png`](./reference/logo-heart.png) são o logo
**simplificado de uma cor** que o site usa hoje no ícone. ⚠️ Esse SVG é uma
vetorização automática com **bordas serrilhadas** (35 mil caracteres de
caminho): **não o extrude**. Use apenas como conferência de proporção.

O ícone do app (`public/icon-512.png`) mostra o logo branco sobre um degradê de
azul-petróleo (`#11737B`) para âmbar (`#DCA75E`). O âmbar **não** faz parte do
logo oficial; não o use no símbolo.

## 7. Cores (use o campo **Hex** do Blender)

Imagem: [`reference/brand-palette.png`](./reference/brand-palette.png).

| Papel | Nome no site | Hex |
|---|---|---|
| Primária | `brand-500` | `#10B981` |
| Primária escura | `brand-600` / `brand-700` | `#059669` / `#047857` |
| Verde profundo | `brand-900` | `#064E3B` |
| Verde claríssimo | `brand-50` | `#ECFDF5` |
| Apoio | `teal-500` / `teal-400` | `#14B8A6` / `#2DD4BF` |
| Fundo escuro | `ink-950` | `#070B18` |
| Cinza-azulado | `ink-50` | `#F4F7FB` |
| Verde-limão do logo | amostrar do logo oficial | (medir) |
| Alerta (só detalhes) | — | `#EF4444` |

**Gestão de cor:** use *View Transform* **Standard** (não Filmic/AgX), para o
verde sair com o hex exato. Nada de luz colorida forte: o verde da marca já
é saturado.

## 8. Critérios de aceite (valem para todos)

- [ ] Cabe no orçamento de peso de [`EXPORT.md`](./EXPORT.md).
- [ ] Silhueta legível a 64 px de largura (teste reduzindo a captura).
- [ ] Bom sobre branco **e** sobre `#070B18`.
- [ ] Nomes de objetos e materiais seguem a convenção de `EXPORT.md`.
- [ ] Escala real, origem no centro do objeto, frente voltada para `-Y` no
      Blender (vira `+Z` no glTF).
- [ ] Sem texturas desnecessárias; as que existirem em WebP ≤ 1024 px.
- [ ] Nenhum item proibido da seção 3.
- [ ] `qa-review` sem pendências.

## 9. O que o outro agente (nuvem) vai fazer, para você saber

- Carregar o `.glb` só quando a pessoa chega naquele ponto da página.
- Girar/inclinar o modelo por código (**não grave rotação nas animações**,
  salvo se `ASSETS.md` pedir).
- Trocar a textura da tela do celular em código (o modelo só precisa do
  material `MAT_Screen` com UV correto).
- Usar o **poster** (imagem) no celular de quem acessa, em navegadores sem
  WebGL e enquanto o `.glb` carrega.
- Hospedar o decodificador Draco no próprio site.

## 10. Dúvidas

Se algo estiver ambíguo, **pergunte ao usuário antes de supor**. Se uma regra
da seção 3 conflitar com um pedido, a seção 3 vence e você avisa.
