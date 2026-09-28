---
name: peca-nova
description: Cria uma peça nova do @rivocode/ui completa: wrapper, tipos, preview, doc, teste, índice e verificações. Use ao adicionar qualquer componente ao catálogo, e antes de dizer que uma peça está pronta.
tools: Read, Write, Edit, Bash, Glob, Grep
---

Uma peça deste catálogo tem nove artefatos, e ela não existe enquanto os nove
não existirem. O `FileUpload` foi publicado com a página de documentação
pronta e o componente ausente: quem seguia a doc quebrava em tempo de build, e
um agente lendo o índice propunha a peça com confiança. É o que acontece
quando um dos nove sai de sincronia.

## A ordem, e nenhuma etapa é opcional

1. **Confira que a peça não existe com outro nome.** `reference/components.md`
   da skill lista as escolhas entre peças parecidas: `PreviewCard` é o
   HoverCard, `Tree` é o TreeView, `MaskedInput` é o MaskInput, `Alert` é o
   Callout, `Slider` com dois valores é o RangeSlider.

2. **Wrapper sobre a Base UI quando houver primitivo; do zero quando não.**
   Sem cor literal, sem `z-index` numérico, sem altura cravada: as três têm
   guarda no `check`, e a de cor falha o build. Altura de controle sai de
   `--rc-control-*`, canto de `--rc-radius-*`, empilhamento de `--rc-z-*`.

3. **`classNames` por parte, se a peça tiver mais de um nó.** O tipo é
   `Slots<"track" | "indicator">`, de `src/lib/slots.ts`, e os nomes são os
   mesmos que a seção "Partes" da página vai usar. Sem isso, quem consome
   alcança o nó interno por `[&_div]` e acopla a tela à árvore da peça.

4. **Preview em `.design-sync/previews/<Peça>.tsx`.** É o arquivo que vira
   exemplo na doc e no site. Publique o arquivo inteiro, com as constantes de
   apoio: o recorte que corta a constante produz um exemplo que não roda, e
   `check:previews` não pega isso porque o arquivo compila.

5. **Página em `.design-sync/docs/<Peça>.md`.** Frontmatter com `category`, a
   prosa do que a peça faz, e (obrigatória) a seção "quando não usar", com a
   peça vizinha nomeada: `Progress` anda e termina, `Meter` fica parado;
   `Toast` passa, `Alert` fica; `Steps` olha para frente, `Timeline` olha para
   trás; `Dialog` dispensa clicando fora, `AlertDialog` não. A tabela de props
   você **não escreve**: ela sai do compilador.

6. **Teste em `test/`, com `@testing-library`.** O que se testa é o
   comportamento que a prosa promete, incluindo os estados que mentem quando
   errados: vazio, carregando, erro, desabilitado, indeterminado.

7. **Rode `bun run gen:props`** para as tabelas saírem, e confira que a peça
   aparece com as props que você espera, inclusive os callbacks.

8. **Pares de contraste novos em `scripts/check-contrast.ts`**, se a peça
   estreou combinação de cor que ainda não é medida. Fronteira de controle
   pede 3:1; texto sobre fundo de estado pede 4,5:1 com o alfa composto.

9. **O lado nativo, no mesmo dia.** Escreva a linha da peça em
   `scripts/paridade-nativo.ts` antes de dizer que terminou: `check:paridade`
   recusa página sem linha. Se a peça porta, construa o par em `native/src/` na
   mesma leva: a API não é a mesma (no nativo tudo é controlado e a lista vem
   por `items`), mas a escolha da peça e o vocabulário de classes são. Se não
   porta, diga o motivo na linha. E `fila` é só para decisão de gesto ainda não
   tomada (nunca para falta de tempo), e exige entrada em `FILA_DECLARADA`.

## Antes de dizer que terminou

`bun run check` inteiro, que é lint, tipos, previews, props, cor literal,
contraste, temas, contrato, nativo e testes. Depois `bun run build`, que é
onde aparece o que só quebra ao empacotar.

E o teste que ninguém automatiza: renderize no `demo/` e olhe nos dois temas e
nas duas densidades. Estado indeterminado e estado carregando são invisíveis
para o `tsc` e gritantes numa captura.
