# Handoff do Claude Code local para o da nuvem

Branch de trabalho: `claude/vigilant-thompson-mjo9k9`. Os dois agentes dão push
nela: sempre `git pull --rebase origin claude/vigilant-thompson-mjo9k9` antes
de enviar.

## O que foi feito (fotos)

- Seguido o `docs/fotos/BRIEFING.md`. As 8 fotos agora são arquivos locais em
  `public/photos/<chave>.jpg` e `components/landing/photos.ts` aponta para eles
  (sem `pexels()`, sem `hero`/`doctor`/`tablet`).
- Cada foto foi aberta e olhada. Créditos, links, licença e KB estão na tabela
  "Fotos escolhidas" do briefing.
- `registerDoctor` voltou, a pedido do dono, à foto anterior (Pexels 7195379).
  Não troque sem ele pedir.
- Descartadas por quebrarem as regras do projeto: logo da Apple visível, relógio
  na parede, frascos de remédio no fundo, máscara/paciente doente. IDs
  descartados estão no fim do briefing.
- `login.jpg` tem 708 KB de propósito (textura do mar). As outras ficam abaixo
  de 500 KB.

## Ainda não feito

- Conferir no navegador, em 1440 px e 390 px, rosto cortado e legibilidade do
  texto sobre cada foto. O agente local só validou as imagens, não as telas.
- O autor de `registerDoctor` ("Karola G / kaboompics") veio de leitura
  automática da página e não foi confirmado.
- `images.pexels.com` continua no CSP e em `remotePatterns` (`next.config.mjs`).
  Pode sair se nada mais usar o CDN.

## Prévias da Vercel

`vercel.json` ganhou `ignoreCommand`: só a `main` builda; outra branch só gera
prévia se o commit tiver `[preview]` na mensagem. Vale apenas para branches que
já contenham esse `vercel.json`. As antigas continuam buildando até o dono
configurar "Ignored Build Step" no painel. Para pedir uma prévia desta branch:
`git commit --allow-empty -m "[preview]"` e push.

## Armadilhas do ambiente local

- Sem ImageMagick; use Pillow (`python`, já instalado) para redimensionar.
- Páginas do Pexels respondem "Just a moment..." ao `curl` (Cloudflare). O
  download das imagens em `images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg`
  funciona; para o nome do autor, só o WebFetch.
- `npx tsc --noEmit | grep -c "error TS"` dá 86 (limite do projeto é 60). Os
  erros já existiam, estão em `components/three/Stage.tsx`, páginas de consulta
  e `lib/validations/auth.ts`. Nenhum vem das fotos.
- Avisos "LF will be replaced by CRLF" no git são do Windows e podem ser
  ignorados.
