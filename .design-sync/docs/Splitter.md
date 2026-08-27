---
category: Estrutura
---

# Splitter

Duas áreas com uma divisória que se arrasta: lista à esquerda e detalhe à
direita, árvore e conteúdo, tabela e inspetor.

A divisória é um `separator` de verdade, com valor, mínimo e máximo, e anda
pelas setas: `Home` e `End` vão aos extremos. Arrastar com o mouse é metade da
peça: sem teclado, quem não usa ponteiro fica preso na proporção que o
desenvolvedor escolheu, e essa proporção costuma ser a que serve para a tela de
quem escreveu.

O alvo da divisória tem 12px enquanto a linha desenha 1. Uma divisória fácil de
pegar é a diferença entre a peça funcionar e a pessoa desistir dela.

No celular os dois lados empilham e a divisória some. Duas colunas de 190px não
são duas colunas: são duas listas ilegíveis, e arrastar uma borda de 4px com o
dedo não é gesto que exista.

## Sentido da escrita

Em `dir="rtl"` a divisória vira junto. O `start` passa a ser o lado direito, o
arraste mede a partir da borda onde a leitura começa e as setas andam para o
lado que a pessoa vê: `→` empurra a divisória para a direita, `←` para a
esquerda, mesmo que o número de `size` ande no sentido contrário. `Home` e
`End` continuam lógicos: o mínimo e o máximo do primeiro lado, e não a esquerda
e a direita.

A direção vem do `RivoProvider`, e não de um `dir` escrito à mão num elemento
acima da peça. É o mesmo `dir` que o resto do catálogo lê, e sem ele a
divisória espelharia o desenho sem espelhar a conta: arrastar o ponteiro 120px
para a direita a moveria 118px para a esquerda.

## Quando não usar

Para esconder e mostrar uma área inteira, use `Collapsible` ou a `Sidebar`: o
splitter existe para quando as duas áreas ficam visíveis ao mesmo tempo e a
proporção entre elas é a decisão.

## No React Native

Não porta, por decisão - duas áreas lado a lado não cabem em tela estreita; no celular a lista e o detalhe são duas telas do router. Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de cada uma.
