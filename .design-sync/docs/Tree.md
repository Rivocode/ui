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

`value` e `onValueChange`, o mesmo par do `TreeSelect` (que é esta peça dentro
de um painel) e o mesmo vocabulário do resto do catálogo. Os dois são
opcionais: sem nenhum deles a árvore guarda a própria escolha, e `defaultValue`
diz com que ela começa.

Eram obrigatórios, e com outro nome: trocar o painel pela árvore inline
reescrevia o binding inteiro, e uma árvore que só queria abrir e fechar ainda
pagava um `useState` para existir.

## Sentido da escrita

Em `dir="rtl"` a árvore inteira vira. O recuo de cada nível cresce a partir da
borda onde a leitura começa, a seta do galho aponta para o lado que ele abre, e
`→` e `←` trocam de papel: `←` abre o galho e entra nele, `→` fecha e sobe para
o pai. É o que o padrão WAI-ARIA de treeview pede, e a razão é o desenho — a
tecla que abre é a que aponta para onde a indentação cresce.

A direção vem do `RivoProvider`, e não de um `dir` escrito à mão num elemento
acima da peça. E o recuo é `padding-inline-start`, e não `padding-left`: com a
propriedade física os três níveis paravam no mesmo ponto em `rtl`, a hierarquia
sumia da tela e sobrava uma lista plana — trocar só a tecla teria consertado o
teclado para um desenho que continuava errado.

## No React Native

Traduz, e a regra sobrevive inteira: **quem vale é a folha**. Marcar um galho marca todas as folhas debaixo dele, e o que sai em `onValueChange` é sempre uma lista de folhas.

**O desenho é que não porta.** No web os níveis abertos aparecem ao mesmo tempo, um recuo por nível; a 390px o terceiro nível começa depois do meio da tela e o nome do nó cabe em quatro letras. A peça fica ilegível justamente onde ela é mais útil. Aqui é **um nível por vez**: tocar num galho empurra o nível de dentro, e o cabeçalho mostra o caminho ("Financeiro › Contas a pagar", cortado pela frente, porque o pedaço que importa é o último) e volta um nível.

Duas consequências do empilhamento. **O galho tem dois alvos**: tocar no nome entra, e a caixa ao lado marca o galho inteiro: com um alvo só não havia como marcar "Financeiro" sem visitar as sete folhas de dentro. E **não há estado misto na caixa**, porque o `Checkbox` nativo não tem: o galho meio marcado aparece com a caixa vazia e um "2 de 7 escolhidos" embaixo do nome (texto, que se lê e se ouve, no lugar de um tracinho que só se vê).

Fora, por decisão: `filter` (buscar dentro de árvore achata os níveis, e lista achatada com busca já é o `Combobox`), `expanded`/`onExpandedChange` (não há aberto e fechado, há o nível onde o dedo está) e o `label` do nó, que aqui é `string`. Ele é montado dentro do rótulo falado e do caminho, e de um `ReactNode` não há como ler o texto de volta.
