---
category: Formulário
---

# Editable

Edição no lugar: o texto vira campo ao ser clicado, e volta a ser texto ao ser
confirmado.

É o gesto que separa painel de leitura de painel de operação. Corrigir o nome de
um cliente sem abrir uma tela de edição, sem perder a posição na lista e sem
esperar duas navegações é a diferença entre a pessoa corrigir e a pessoa deixar
errado.

Duas decisões que a peça toma, e que são a razão de ela existir. **O Escape
desfaz**: sair pela lateral é o gesto de quem se arrependeu, e salvar ali
transforma um clique errado numa edição que ninguém pediu. **Sair do campo
salva**: é o oposto do Escape de propósito, porque quem clicou fora seguiu
adiante, e exigir um Enter depois disso perde o que foi escrito sem avisar.

Fechado, o texto é um `button`. Quem navega pelo teclado precisa saber que
aquilo abre alguma coisa, e um `div` com `onClick` não diz isso a ninguém.

## Quando não usar

Quando a mudança precisa de confirmação explícita — valor, alíquota, qualquer
campo que o servidor valida e pode recusar. Ali um `Dialog` com Salvar e
Cancelar diz o que está em jogo; a edição no lugar promete que é barato desfazer.

## No React Native

Ainda não portado — o texto que vira campo depende de foco e de Escape; no toque ele quer outro gesto, ainda não desenhado. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
