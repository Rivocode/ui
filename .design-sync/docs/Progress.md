---
category: Feedback
---

# Progress

Barra de progresso de tarefa com fim conhecido: enviar arquivo, gerar relatório.

Sem `value` ela vira indeterminada; nesse caso prefira o `Spinner`, que ocupa
menos e não promete um fim que ninguém sabe medir.

`format` escreve o número do `showValue`: o nome de um formatador da casa, ou
uma função sua. Ele recebe o valor limitado a `min` e `max`, o mesmo que a
barra desenha, e não é chamado quando a barra está indeterminada.

## Movimento

A barra enche do zero na montagem, pela escala horizontal a partir da esquerda (`animate-fill`, `--rc-duration-slow`), e depois anda até cada valor novo pela largura. O indeterminado troca a entrada pelo vaivem dele. Com "reduzir movimento", a barra nasce no valor.

## Quando não usar

Para quanto de uma capacidade está em uso (espaço em disco, cota de notas do
mês, limite de crédito), use `Meter`. A diferença não é de aparência, é do que
o número faz: o progresso anda para o fim e termina, a medida fica parada e pode
subir e descer.

Trocar um pelo outro chega ao leitor de tela: a barra de progresso é anunciada
como algo que carrega, e "carregando 72%" para um disco que não está carregando
nada faz quem ouve esperar por um fim que nunca vem.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Progress` - `value` de 0 a 100 e `label`; `showValue` e `format` como no web; a barra anda até o valor novo; `classNames` com as quatro partes do web. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
