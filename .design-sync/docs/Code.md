---
category: Dados
---

# Code

Código dentro de uma frase: nome de arquivo, comando de terminal, chave de um
JSON, nome de prop.

Não é `Kbd`. A sombra de tecla promete "aperte isto", e prometer errado custa
mais do que não prometer nada. O `Kbd` é para a combinação que a pessoa vai
digitar, e este é para o texto que ela vai ler ou copiar.

## Quando não usar

Para bloco (retorno de API, linha de log, trecho de configuração), use
`CodeBlock`, que rola sozinho. `Code` dentro de um parágrafo com uma linha
longa estica a página inteira.

## No React Native

Traduz, e ele vai dentro de um `Text`: `Abra o <Code>app.json</Code>` quebra linha junto com a frase que o cerca. **A rolagem horizontal que a fila prometia nunca foi deste lado:** barra de rolagem dentro de um parágrafo é armadilha para o dedo que rola a tela, e quem precisa dela é o `CodeBlock` (retorno de API, linha de log), que é outra peça e ainda não portou. O argumento é o inverso do daqui: lá quebrar um JSON no meio muda o que está escrito, e aqui quebrar um caminho longo no meio é o certo, porque a alternativa é esticar a tela inteira. O corpo da letra não é escrito: o `Text` aninhado herda o do texto de fora, que é o que o `0.9em` do web dizia. E `selectable` vem ligado, porque o toque longo é o gesto nativo para copiar. No Android quem seleciona é o `Text` de fora, e ali é ele que precisa carregar a prop.
