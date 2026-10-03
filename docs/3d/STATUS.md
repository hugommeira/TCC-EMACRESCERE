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
| 2 | `phone-app` | ⬜ | — | — | ⬜ | — | |
| 3 | `seal-signature` | ⬜ | — | — | ⬜ | — | |

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

- (nada por enquanto)

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
