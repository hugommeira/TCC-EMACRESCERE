# Exportação, nomes e orçamento de peso

Valem para **todos** os assets de [`ASSETS.md`](./ASSETS.md).

## 1. Onde cada arquivo vai

```
public/3d/
├── logo-heart.glb
├── phone-app.glb
├── seal-signature.glb
├── posters/            ← uma imagem por .glb, em 2 tamanhos (@1x e normal)
│   ├── logo-heart.webp
│   ├── logo-heart@1x.webp
│   └── …
├── steps/              ← ícones step-*.webp (+ @1x)
├── queue-hourglass.webp
└── queue-hourglass-loop.webp
art/3d-src/             ← os .blend de trabalho (se < 10 MB cada)
```

`public/3d/screens/` (texturas do celular) **não é seu**: a nuvem preenche.

## 2. Nomes

- **Arquivos:** minúsculas, hífen, sem acento nem espaço (`logo-heart.glb`).
- **Objetos:** `Asset_Parte` em PascalCase com underline (`Logo_Body`,
  `Phone_Screen`). Sem `.001` no fim: renomeie duplicatas.
- **Materiais:** `MAT_Asset_Parte` (`MAT_Logo_Body`). Sem acento.
- **Raiz:** um *Empty* com o nome do asset (`Logo`, `Phone`, `Seal`) contendo
  todas as peças. Ele é a única coisa que o site vai girar ou escalar.
- **Pivô:** no centro do conjunto (não no canto, não em `0,0,0` solto).

## 3. Orçamento de peso (limite duro)

| Asset | Triângulos | `.glb` final | Poster normal / @1x |
|---|---|---|---|
| `logo-heart` | ≤ 8.000 | ≤ 150 KB | 1200² ≤ 90 KB / 600² |
| `phone-app` | ≤ 20.000 | ≤ 350 KB | 900×1800 ≤ 140 KB / 450×900 |
| `seal-signature` | ≤ 10.000 | ≤ 200 KB | 1000² ≤ 80 KB / 500² |
| `step-*` (cada) | só imagem | — | 512² ≤ 40 KB / 256² |
| `queue-hourglass` | só imagem | — | loop ≤ 300 KB; parada ≤ 30 KB |

**Soma dos `.glb`: ≤ 700 KB. Tudo em `public/3d/`: ≤ 1,5 MB.**
Estourou? Corte detalhes (segmentos do chanfro, texturas, botões do celular)
antes de pedir mais orçamento.

## 4. Exportar do Blender (glTF 2.0, binário `.glb`)

Exporte **sem compressão** e comprima depois (passo 5). Assim o resultado é
sempre o mesmo.

| Opção | Valor |
|---|---|
| Formato | glTF Binary (`.glb`) |
| Incluir | só os objetos selecionados (o Empty do asset e filhos) |
| Transformar | **+Y Up** |
| Malha: Aplicar modificadores | ligado |
| Malha: UVs e Normais | ligados |
| Malha: **Cor de vértice** | ligado **se** usou degradê por vértice |
| Materiais | Exportar |
| Imagens | WebP (ou Automático) |
| Animação | **desligada** (a rotação é feita no código), salvo pedido em `ASSETS.md` |
| Luzes e câmeras | **desligadas** (o site tem as suas) |
| Compressão (Draco) | **desligada** neste passo |

Orientação: no Blender a **frente do objeto olha para `-Y`**; no glTF isso
vira `+Z`, que é para onde a câmera do site olha.

## 5. Otimizar e conferir (terminal, na raiz do projeto)

```bash
# comprimir (preferir meshopt: o site já traz o decodificador, sem arquivos externos)
npx @gltf-transform/cli optimize bruto.glb public/3d/logo-heart.glb \
  --compress meshopt --texture-compress webp --texture-size 1024

# inspecionar: triângulos, materiais, texturas, tamanho
npx @gltf-transform/cli inspect public/3d/logo-heart.glb

# validar contra a especificação glTF (não pode ter erros)
npx @gltf-transform/cli validate public/3d/logo-heart.glb
```

Se o `.glb` passar do orçamento com `meshopt`, tente `--compress draco` e
**avise o usuário** (Draco exige arquivos de decodificação que a nuvem precisa
hospedar).

## 6. Imagens (posters, ícones, loop)

- Render com **fundo transparente** (Film → Transparent), *View Transform*
  **Standard**, formato PNG de 16 bits; depois converta para **WebP** com
  alfa: `cwebp -q 85 -alpha_q 90 entrada.png -o saida.webp`.
- Nunca entregue PNG ou JPG no lugar do WebP (peso).
- O loop animado: `img2webp -loop 0 -lossy -q 80 -d 41 quadro_*.png -o loop.webp`
  (41 ms ≈ 24 quadros/s). Confira que o último quadro emenda no primeiro.

## 7. Conferência antes de entregar (checklist de QA)

- [ ] `inspect` mostra triângulos e tamanho **dentro do orçamento** (tabela 3).
- [ ] `validate` sem **erros** (avisos de extensão são aceitáveis; registre-os).
- [ ] Reimportou o `.glb` no Blender e conferiu: escala, frente, pivô, cores.
- [ ] Capturas sobre fundo branco **e** sobre `#070B18` sem halo claro nas
      bordas do poster.
- [ ] Nomes de objetos e materiais sem `.001`, espaço ou acento.
- [ ] Nenhum item proibido (`BRIEFING.md`, seção 3).
- [ ] `STATUS.md` atualizado com tamanhos reais e decisões.
