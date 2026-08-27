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

O alvo da divisória tem 25px enquanto a linha desenha 1. O número vem da WCAG
2.5.8 (Target Size Minimum, AA), que pede 24: um `::after` transparente estica
12px para cada lado, e o desenho não engorda um pixel. Ele já esticou 6px, o
alvo media 13px, e era a única mira abaixo de 24 do catálogo inteiro. Uma
divisória fácil de pegar é a diferença entre a peça funcionar e a pessoa
desistir dela.

A divisória diz a medida com unidade. `aria-valuenow` sozinho faz o leitor de
tela anunciar "50" pelado, que não é medida de coisa nenhuma; o `aria-valuetext`
diz "50%". E ela aponta para o lado que mede, por `aria-controls`: o valor
descreve sempre o primeiro lado, e sem a referência não há como saber qual dos
dois é.

O nome mora no `separator`, e não na moldura. `label` nomeia o nó que tem o
papel, porque é ele que o leitor de tela expõe; um `aria-label` escrito por quem
chama cai no mesmo lugar e vence o `label`. Antes ele parava na `div` externa,
que o Chrome guarda como um nó `generic` nomeado e nenhum leitor anuncia.

No celular os dois lados empilham e a divisória some. Duas colunas de 190px não
são duas colunas: são duas listas ilegíveis, e arrastar uma borda de 4px com o
dedo não é gesto que exista.

## A 200% de zoom a divisória some, e isso é a resposta

Zoom de 200% numa tela de 1280 deixa a viewport efetiva em 640px, que é o que a
peça já trata como estreito. Medido no Chrome a 640px e a 400px: a moldura vira
`flex-direction: column` e a alça sai em `display: none`.

É desenho, e não defeito. `display: none` tira a alça do ciclo de tabulação
junto com o desenho, então não sobra parada órfã nem alvo invisível. E o
controle perdeu o trabalho no mesmo movimento em que sumiu: empilhados, os dois
lados aparecem inteiros, um embaixo do outro, e não há proporção para negociar
entre eles. A WCAG 1.4.10 cobra o conteúdo e a função alcançáveis a 320px, e o
conteúdo fica.

Também não há aviso de que o controle sumiu, e isso é escolha. Anunciar o
desaparecimento de um controle que deixou de ter função é ruído numa região
viva, e o tamanho fica congelado no valor que estava: nada se perde ao voltar
para a largura de mesa.

Na orientação `vertical` a alça não some em largura nenhuma, porque empilhado já
é o desenho dela.

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
