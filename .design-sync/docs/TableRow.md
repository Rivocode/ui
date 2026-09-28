---
category: Estrutura
---

# TableRow

Uma linha da tabela.

`selected` desenha uma barra de acento na lateral, com fundo tênue. A barra é
que diz "esta linha", e fundo forte mancha a leitura da linha inteira.

Cor sozinha não é estado, então a primeira célula da linha escolhida abre com
um `<span>` que só o leitor de tela ouve: "Selecionada". É sempre a primeira
célula, para quem ouve saber onde o aviso aparece. `labels.selected` troca o
texto quando a tela está em outro idioma.

Não há `aria-selected` aqui. Ele só é válido dentro de `grid` ou `treegrid`, e
num `<table>` simples o navegador descarta o atributo: medido na árvore de
acessibilidade, a linha expunha zero propriedades. Adotar `role="grid"` traria
a obrigação de navegar por setas entre as células, que a peça não implementa,
e trocaria um defeito por outro maior.
