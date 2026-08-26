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

## Quando não usar

Para esconder e mostrar uma área inteira, use `Collapsible` ou a `Sidebar`: o
splitter existe para quando as duas áreas ficam visíveis ao mesmo tempo e a
proporção entre elas é a decisão.
