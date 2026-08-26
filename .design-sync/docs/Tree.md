---
category: Formulário
---

# Tree

A arvore sozinha, sem campo nem painel. Serve para navegador de pastas e para
escolha em tela cheia.

Pai com parte das filhas marcadas fica no estado misto. A busca guarda o caminho
até quem casou, senao o resultado aparece solto e ninguém sabe de onde veio.

As setas do teclado andam pelas linhas que estao na tela, e não pela arvore
inteira: a navegação segue o que o olho ve.

## A escolha

`value` e `onValueChange`, o mesmo par do `TreeSelect` — que é esta peça dentro
de um painel — e o mesmo vocabulário do resto do catálogo. Os dois são
opcionais: sem nenhum deles a árvore guarda a própria escolha, e `defaultValue`
diz com que ela começa.

Eram obrigatórios, e se chamavam `selected` e `onSelectedChange`: trocar o
painel pela árvore inline reescrevia o binding inteiro. Os nomes antigos
continuam funcionando e saem numa versão maior.

## No React Native

Ainda não portado — hierarquia em tela estreita quer navegação por níveis, e a peça que faz isso ainda não existe. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
