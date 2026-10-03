# Prompt para colar no Claude Code local

Pré-requisitos (uma vez só):

1. Salvar o logo oficial em `docs/3d/reference/logo-oficial.png`.
2. Blender aberto, addon BlenderMCP conectado e `claude mcp add blender -- uvx blender-mcp`
   (passo a passo em `docs/frontend-handoff.md`, seção "3D e Blender").
3. Estar na branch `3d-assets` (`git checkout -b 3d-assets claude/vigilant-thompson-mjo9k9`).

Depois, abra o Claude Code na pasta do projeto e cole:

````text
Você vai criar os assets 3D do site Emacrescere no Blender.

Leia, nesta ordem, antes de qualquer ação:
1. docs/3d/BRIEFING.md  (missão, regras que não se negociam, cores, ordem)
2. docs/3d/ASSETS.md    (medidas, peças e materiais de cada asset)
3. docs/3d/EXPORT.md    (nomes, orçamento de peso, exportação, conferência)
4. docs/3d/STATUS.md    (andamento; atualize-o a cada entrega)
Veja as imagens em docs/3d/reference/ (logo-oficial.png, roteiro-5-telas.png,
screens/, brand-palette.png).

Use as skills em .claude/skills, começando por blender-director, e opere o
Blender pelo MCP.

Comece SOMENTE pelo asset 1 (logo-heart). Antes de modelar:
- confirme que o MCP do Blender responde;
- confirme que docs/3d/reference/logo-oficial.png existe (se não, pare e me peça);
- me diga em 5 linhas como pretende modelar o laço em fita, a folha e a cabeça.

Ao terminar o asset, PARE e me mostre: 3 capturas (frente, 3/4, costas) sobre
fundo claro e sobre #070B18, triângulos, tamanho do .glb em KB e a lista de
arquivos. Só siga para o próximo depois do meu "aprovado".

Regras que valem sempre: nada de medicamento (cápsula, caneta, frasco) nem
corpo humano realista; não mexa em app/, components/ nem next.config.mjs;
commits só com public/3d/, art/3d-src/ e docs/3d/STATUS.md; na dúvida, pergunte.
````
