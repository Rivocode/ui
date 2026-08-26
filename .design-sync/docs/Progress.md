---
category: Feedback
---

# Progress

Barra de progresso de tarefa com fim conhecido: enviar arquivo, gerar relatório.

Sem `value` ela vira indeterminada; nesse caso prefira o `Spinner`, que ocupa
menos e não promete um fim que ninguém sabe medir.

`format` escreve o número do `showValue`: o nome de um formatador da casa, ou
uma função sua.

## Quando não usar

Para quanto de uma capacidade está em uso — espaço em disco, cota de notas do
mês, limite de crédito — use `Meter`. A diferença não é de aparência, é do que
o número faz: o progresso anda para o fim e termina, a medida fica parada e pode
subir e descer.

Trocar um pelo outro chega ao leitor de tela: a barra de progresso é anunciada
como algo que carrega, e "carregando 72%" para um disco que não está carregando
nada faz quem ouve esperar por um fim que nunca vem.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Progress` — `value` de 0 a 100 e `label`; sem `format`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
