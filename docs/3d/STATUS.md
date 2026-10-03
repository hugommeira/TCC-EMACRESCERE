# Andamento dos assets 3D

Atualize este arquivo a cada entrega. O agente da nuvem lê aqui para saber o
que já pode ligar no site.

**Legenda:** ⬜ não começou · 🟨 em andamento · ✅ entregue e aprovado

## Antes de começar

- [x] `docs/3d/reference/logo-oficial.png` está no repositório (o usuário
      salva o arquivo; sem ele, **pare e peça**).
- [x] Blender conectado ao Claude por MCP (`docs/frontend-handoff.md`). Blender 5.2.2 LTS, addon 1.8.
- [x] Branch `3d-assets` criada a partir de `claude/vigilant-thompson-mjo9k9`.
- [x] `@gltf-transform/cli` 4.5.1 funciona (Node 24). Obs.: `npx` falhou com `ECOMPROMISED`
      (bug de lock do npm 11); a CLI foi instalada numa pasta temporária, fora do projeto.

## Assets

| # | Asset | Modelo | `.glb` (KB) | Triângulos | Poster | Aprovado por | Observações |
|---|---|---|---|---|---|---|---|
| 1 | `logo-heart` | ✅ | 57,1 | 6.588 | ✅ | Hugo (03/10/2026) | 1 material, textura 256² WebP (2 KB). |
| 2 | `phone-app` | ✅ | 22,5 | 2.254 | ✅ | Hugo (03/10/2026) | 3 materiais; tela provisória `tela-3-videochamada` (WebP 6 KB embutido). |
| 3 | `seal-signature` | ✅ | 39,6 | 6.888 | ✅ | Hugo (03/10/2026) | 4 materiais, sem textura. |

## Decisões tomadas (preencha ao decidir)

| Data | Decisão | Quem decidiu |
|---|---|---|
| 03/10/2026 | Hex amostrados do logo oficial (verde profundo / médio / limão): `#067B60` (face interna do laço) · `#0B8969` (ponta em V) · `#46BD8B` (laço, médio) · `#BBE29C` (limão, alto do braço) | Claude (amostragem) |
| 03/10/2026 | Cabeça do logo no verde do degradê (sim/não): **sim**, a cor vem da própria imagem (`#1BA27C` embaixo → `#9DD78B` no alto à direita) | Claude (aprovado pelo Hugo) |
| 03/10/2026 | Degradê por **textura 256×256** projetada de frente a partir de `logo-oficial.png` (não cor de vértice): reproduz o sombreado pintado do logo e pesa 2 KB em WebP. Um só material `MAT_Logo` para as 3 peças. | Claude (aprovado pelo Hugo) |
| 03/10/2026 | Contorno extraído da imagem oficial (marching squares + suavização), não do SVG do site. Silhueta frontal × logo oficial: IoU 0,982 (diferença ≤ 1 px na borda). | Claude |
| 03/10/2026 | A ponta em "V" com a dobrinha ficou no `Logo_Leaf` (no logo ela é a continuação da folha); o `Logo_Body` tem laço, braços e tronco. | Claude (aprovado pelo Hugo) |
| 03/10/2026 | Cabeça com 0,0377 m (proporção do logo para 0,20 m de largura), não 0,036 m. Profundidade 0,026 m. | Claude (aprovado pelo Hugo) |
| 03/10/2026 | Poster: o logo ocupa 74% da altura (89% da largura), porque a 80% da altura ele encostaria nas laterais. | Claude (aprovado pelo Hugo) |
| 03/10/2026 | WebP dos posters gerado com Pillow (q 85, alfa 90): `cwebp` não está instalado. | Claude |
| 03/10/2026 | `phone-app`: tela provisória = `tela-3-videochamada` (a tela 1 "Agendar" não existe em `reference/screens/`). Os cantos da imagem (moldura do mockup e fundo claro) foram preenchidos com a cor da própria tela: `art/3d-src/phone-screen_placeholder.png`. | Claude (aprovado pelo Hugo) |
| 03/10/2026 | `phone-app`: poster renderizado com a tela provisória de 260×540 ampliada (texto um pouco macio). Refazer o poster quando as telas definitivas 1040×2160 chegarem em `public/3d/screens/`. | Claude (aprovado pelo Hugo) |
| 03/10/2026 | `phone-app`: borda do corpo com chanfro de 0,0028 m em 4 segmentos; botões: 2 de volume à esquerda e 1 de energia à direita, saliência de 0,7 mm. | Claude |
| 03/10/2026 | `seal-signature`: borda com 14 lóbulos senoidais (amplitude 2,2 mm; diâmetro máx. 0,10 m); anel `Seal_Ring` em relevo **na frente e no verso** (para o giro não mostrar um verso vazio); escudo com 2,4 mm de relevo e check com mais 2,2 mm. Todos os materiais com metálico 0 (evita cara de medalha esportiva). | Claude (aprovado pelo Hugo) |

## Entregas para o agente da nuvem

Quando um asset for aprovado, copie a linha abaixo preenchida, para o agente
do site saber o que ligar:

```
asset: logo-heart
arquivo: public/3d/logo-heart.glb
poster: public/3d/posters/logo-heart.webp (+ @1x)
objetos: Logo_Body, Logo_Leaf, Logo_Head
materiais: (nomes)
tamanho: __ KB · __ triângulos
notas para o código: (ex.: pivô no centro, frente = +Z no glTF)
```

## Pendências e dúvidas

- Totais: soma dos `.glb` = 118,7 KB (limite 700 KB); tudo em `public/3d/` = 287 KB (limite 1,5 MB).
- Refazer o poster do `phone-app` quando as telas definitivas (1040×2160) chegarem em `public/3d/screens/`.

## Entregas prontas


```
asset: logo-heart
arquivo: public/3d/logo-heart.glb
poster: public/3d/posters/logo-heart.webp (+ @1x)
objetos: Logo (Empty raiz) > Logo_Body, Logo_Leaf, Logo_Head
materiais: MAT_Logo (único, baseColor = textura WebP 256², rugosidade 0,38, metálico 0)
tamanho: 57,1 KB · 6.588 triângulos
notas para o código: compressão meshopt (EXT_meshopt_compression + KHR_mesh_quantization),
  precisa do MeshoptDecoder no GLTFLoader; pivô no centro (0,0,0) do Empty `Logo`;
  frente = +Z no glTF; largura 0,20 m; sem animação; material de face única (backface culling).
```

```
asset: phone-app
arquivo: public/3d/phone-app.glb
poster: public/3d/posters/phone-app.webp (+ @1x)
objetos: Phone (Empty raiz) > Phone_Body, Phone_Screen, Phone_Island, Phone_Buttons
materiais: MAT_Phone_Body (#0B1220, rug. 0,3, met. 0,6), MAT_Phone_Black (#000000),
  MAT_Screen (base preta, emissiveTexture, emissiveFactor 1)
tamanho: 22,5 KB · 2.254 triângulos
notas para o código: trocar a tela em MAT_Screen.emissiveMap (flipY = false, padrão do
  GLTFLoader; UV 0–1, U → direita, V → cima, imagem em pé); a textura provisória é 260×540
  (não potência de 2, ok no WebGL2); meshopt; pivô no centro; frente = +Z; sem animação.
```

```
asset: seal-signature
arquivo: public/3d/seal-signature.glb
poster: public/3d/posters/seal-signature.webp (+ @1x)
objetos: Seal (Empty raiz) > Seal_Disc, Seal_Ring, Seal_Shield, Seal_Check
materiais: MAT_Seal_Disc (#10B981, rug. 0,3), MAT_Seal_Ring (#2DD4BF, rug. 0,25),
  MAT_Seal_Shield (#064E3B), MAT_Seal_Check (#FFFFFF, rug. 0,3)
tamanho: 39,6 KB · 6.888 triângulos
notas para o código: o pulo do Seal_Check pode ser feito escalando o próprio nó (origem dele
  em 0,0,0 do conjunto; para escalar a partir do centro do check, compensar a posição);
  meshopt; pivô no centro; frente = +Z; sem animação.
```
