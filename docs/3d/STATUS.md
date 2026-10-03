# Andamento dos assets 3D

Atualize este arquivo a cada entrega. O agente da nuvem lê aqui para saber o
que já pode ligar no site.

**Legenda:** ⬜ não começou · 🟨 em andamento · ✅ entregue e aprovado

## Antes de começar

- [ ] `docs/3d/reference/logo-oficial.png` está no repositório (o usuário
      salva o arquivo; sem ele, **pare e peça**).
- [ ] Blender conectado ao Claude por MCP (`docs/frontend-handoff.md`).
- [ ] Branch `3d-assets` criada a partir de `claude/vigilant-thompson-mjo9k9`.
- [ ] `npx @gltf-transform/cli --help` funciona (Node instalado).

## Assets

| # | Asset | Modelo | `.glb` (KB) | Triângulos | Poster | Aprovado por | Observações |
|---|---|---|---|---|---|---|---|
| 1 | `logo-heart` | ⬜ | — | — | ⬜ | — | |
| 2 | `phone-app` | ⬜ | — | — | ⬜ | — | |
| 3 | `seal-signature` | ⬜ | — | — | ⬜ | — | |

## Decisões tomadas (preencha ao decidir)

| Data | Decisão | Quem decidiu |
|---|---|---|
| | Hex amostrados do logo oficial (verde profundo / médio / limão): | |
| | Cabeça do logo no verde do degradê (sim/não): | |

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
