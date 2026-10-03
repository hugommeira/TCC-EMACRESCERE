# Briefing — fotos do site Emacrescere

Para o Claude Code **local** (o da nuvem não acessa nenhum banco de imagens:
Pexels, Unsplash, Pixabay, Wikimedia e outros são bloqueados lá, então ele
não consegue ver as fotos que escolhe). Você tem internet: **abra e olhe cada
foto antes de usar.**

## 1. Regra principal: qualidade alta, sempre

O dono do projeto pediu: **"sempre priorize a alta qualidade"**. Qualquer
banco serve, desde que a licença permita uso comercial.

- **Original com 4000 px ou mais no lado maior.** Nada de foto pequena ampliada.
- Foco nítido no rosto/assunto, sem ruído, sem compressão visível, sem
  marca d'água.
- Luz natural, tons quentes ou neutros que combinem com o verde da marca
  (`#10B981`, `#064E3B`). Evite fotos com muito vermelho, roxo ou azul forte.
- Pessoas reais, brasileiras ou de aparência diversa, idades 25–60, corpos
  reais (inclusive acima do peso), com dignidade. Nada de pose de banco de
  imagem óbvia (sorriso forçado olhando a câmera, polegar para cima).

## 2. Proibido (regras do projeto, `CLAUDE.md`)

- Remédio, caneta injetora, seringa, comprimido, frasco, farmácia.
- Antes/depois, fita métrica na cintura, balança em destaque, corpo sem
  rosto, roupa folgada "mostrando quanto emagreceu".
- Promessa de resultado (pessoa comemorando número na balança etc.).
- Fila, sala de espera, relógio (o atendimento é só com hora marcada).
- Logos de outras marcas visíveis (Apple, Samsung, Nike…), telas de apps reais.
- Unsplash+ (é pago) e fotos "editorial use only".

## 3. Bancos aceitos

Unsplash (só as gratuitas), Pexels, Pixabay, Burst (Shopify), StockSnap,
Kaboompics, Freepik (só as gratuitas com licença comercial; registre se pedir
atribuição). Na dúvida sobre a licença, não use.

## 4. Onde cada foto entra

Todas são definidas em `components/landing/photos.ts`. Hoje vêm do Pexels por
URL; **troque por arquivo local** (seção 5).

| Chave | Onde aparece | Formato e enquadramento |
|---|---|---|
| `heroMobile` | Topo da landing **no celular** | Vertical (4:5 ou 3:4). Pessoa usando o celular em casa, rosto no terço de cima (o corte usa `object-[center_25%]`). |
| `videoCall` | "Benefícios", coluna da foto | Vertical. Paciente em consulta por vídeo no notebook/celular, de casa. |
| `food` | "Para quem é" | Horizontal. Refeição colorida e caseira, sem cara de dieta da moda. |
| `doctorDesk` | "Para médicos" (cartão escuro, metade direita) | Horizontal. Médico(a) atendendo por vídeo. **Assunto à direita**: a esquerda recebe um degradê escuro. O selo 3D fica no canto de baixo à direita, então deixe esse canto sem rosto. |
| `login` | Painel esquerdo do login (desktop) | Vertical/quadrada. Vida ativa e leve (caminhada, parque, casa iluminada). Fica com 50% de opacidade sob um degradê verde, então prefira foto com bom contraste e **assunto à direita** (o texto fica à esquerda; o logo 3D no topo esquerdo). |
| `register` | Painel do cadastro do paciente | Igual ao `login`, outra cena (ex.: cozinhando em casa, conversa em família). |
| `registerDoctor` | Painel do cadastro do médico (tom escuro) | Médico(a) no consultório ou com notebook, luz mais baixa. |
| `password` | Esqueci/redefinir senha | Calma, pessoa tranquila com o celular. |

**Nenhuma foto se repete entre as telas.** `hero`, `doctor` e `tablet` em
`photos.ts` não estão em uso: pode remover.

## 5. Como entregar

1. Baixe o **original** (tamanho máximo) e guarde a página da foto e o autor.
2. Gere a versão do site: lado maior **2400 px** (heroMobile: 1600 px),
   JPEG qualidade 82 (o `next/image` já serve WebP/AVIF para o navegador).
   Ex.: `magick original.jpg -resize 2400x2400\> -quality 82 -strip saida.jpg`
3. Salve em `public/photos/<chave>.jpg` (ex.: `public/photos/login.jpg`).
   Até ~500 KB cada.
4. Em `photos.ts`, troque `pexels(…)` por `"/photos/<chave>.jpg"` e deixe o
   comentário com **link da página + autor + licença** acima da linha.
5. Confira na tela, em 1440 px e 390 px: rosto não cortado, texto legível
   sobre a foto, nada da lista proibida.
6. Rode `npx tsc --noEmit | grep -c "error TS"` (≤ 60), `npx next lint --dir
   components --dir app` e `npx vitest run`. Commit e push na branch
   `claude/vigilant-thompson-mjo9k9`.

Vantagem de servir local: o site não depende do CDN de terceiros, a foto
nunca some, e a qualidade fica sob nosso controle.

## 6. Ao terminar

Liste no fim deste arquivo, para cada chave: link, autor, licença e tamanho
final em KB. O agente da nuvem lê aqui antes de mexer em fotos.

## Fotos escolhidas

| Chave | Link | Autor | Licença | KB |
|---|---|---|---|---|
| `heroMobile` | https://www.pexels.com/photo/7330711/ | MART PRODUCTION | Pexels License (uso comercial, sem atribuição obrigatória) | 177 |
| `videoCall` | https://www.pexels.com/photo/4474047/ | Ketut Subiyanto | Pexels License (uso comercial, sem atribuição obrigatória) | 439 |
| `food` | https://www.pexels.com/photo/724300/ | Cats Coming | Pexels License (uso comercial, sem atribuição obrigatória) | 402 |
| `doctorDesk` | https://www.pexels.com/photo/8376291/ | Tima Miroshnichenko | Pexels License (uso comercial, sem atribuição obrigatória) | 254 |
| `login` | https://www.pexels.com/photo/4939431/ | Nataliya Vaitkevich | Pexels License (uso comercial, sem atribuição obrigatória) | 708 |
| `register` | https://www.pexels.com/photo/5495142/ | Anastasia Shuraeva | Pexels License (uso comercial, sem atribuição obrigatória) | 314 |
| `registerDoctor` | https://www.pexels.com/photo/7579831/ | cottonbro studio | Pexels License (uso comercial, sem atribuição obrigatória) | 314 |
| `password` | https://www.pexels.com/photo/27176011/ | Helena Lopes | Pexels License (uso comercial, sem atribuição obrigatória) | 332 |

Notas: originais todos com lado maior ≥ 4000 px. `videoCall` foi cortada em 3:4. `login` ficou acima de 500 KB (708) de propósito, para manter a textura do mar sem artefatos. Foram descartadas fotos com marca visível (logo Apple em `7195308`), relógio na parede (`7195424`), frascos de remédio no fundo (`8376152`, `8376339`, `8376227`) e máscara/doente (`4031710`, `7195087`).
