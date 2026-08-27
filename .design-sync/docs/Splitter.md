---
category: Estrutura
---

# Splitter

Duas áreas com uma divisória que se arrasta: lista à esquerda e detalhe à
direita, árvore e conteúdo, tabela e inspetor.

A divisória é um `separator` de verdade, com valor, mínimo e máximo, e anda
pelas setas — `Home` e `End` vão aos extremos. Arrastar com o mouse é metade da
peça: sem teclado, quem não usa ponteiro fica preso na proporção que o
desenvolvedor escolheu, e essa proporção costuma ser a que serve para a tela de
quem escreveu.

O alvo da divisória tem 12px enquanto a linha desenha 1. Uma divisória fácil de
pegar é a diferença entre a peça funcionar e a pessoa desistir dela.

No celular os dois lados empilham e a divisória some. Duas colunas de 190px não
são duas colunas: são duas listas ilegíveis, e arrastar uma borda de 4px com o
dedo não é gesto que exista.

## Sentido da escrita

Em `dir="rtl"` a divisória **não** vira, e este é um limite conhecido. O
desenho espelha sozinho — `start` passa a ser o lado direito —, mas a conta
não: o arraste continua medindo da borda esquerda, e `←`/`→` continuam andando
pelo número. Medido: arrastar o ponteiro 120px para a direita move a divisória
118px para a **esquerda**, e `→` a move para a esquerda também.

Numa tela em rtl, ou o splitter fica fora dela, ou o app troca `start` por
`end` e aceita que o gesto vai contra a mão.

## Quando não usar

Para esconder e mostrar uma área inteira, use `Collapsible` ou a `Sidebar`: o
splitter existe para quando as duas áreas ficam visíveis ao mesmo tempo e a
proporção entre elas é a decisão.

## No React Native

Não porta, por decisão — duas áreas lado a lado não cabem em tela estreita; no celular a lista e o detalhe são duas telas do router. Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de cada uma.
