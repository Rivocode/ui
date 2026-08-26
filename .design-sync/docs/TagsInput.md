---
category: Formulário
---

# TagsInput

Lista de marcadores que a pessoa escreve: etiquetas de uma nota, palavras de um
filtro, emails de um convite.

Três gestos que a peça resolve de uma vez, para não serem resolvidos cinco
vezes diferentes: o Enter fecha a ficha, o Backspace com o campo vazio tira a
última — é o gesto que todo mundo tenta primeiro — e a repetida não entra duas
vezes, porque marcar duas vezes a mesma coisa nunca é o que se quis. Sair do
campo também fecha o que estava escrito: texto digitado e não fechado some ao
enviar o formulário, e ninguém entende por quê.

É controlada de propósito: quem guarda a lista é o app, porque é ele que a
envia.

## Quando não usar

Quando as opções já existem, use `Combobox` com `multiple` e as fichas: ele
mostra o catálogo antes de deixar escolher. O `TagsInput` é para quando a lista
nasce do que se digita e não há o que sugerir.

## No React Native

Traduz, com um gesto a menos. O Enter fecha a ficha e o separador digitado também — mas ele é lido no texto, e não na tecla, porque o `onKeyPress` do Android não chega para o teclado do sistema. É esse mesmo evento que faltava para o Backspace com o campo vazio tirar a última ficha, e por isso ele não porta: no celular a ficha se tira pelo xis, que já precisava existir para o dedo. O resto é igual — a peça é controlada, a repetida não entra duas vezes e sair do campo fecha o que estava meio escrito.
