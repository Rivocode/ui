---
category: Estrutura
---

# Table

Tabela semântica, com `<table>` de verdade.

Compõe com `TableCaption`, `TableHeader`, `TableBody`, `TableFooter`,
`TableRow`, `TableHead` e `TableCell`.

`selected` na linha marca no `aria-selected` e desenha uma barra de acento na
lateral. Cor sozinha não é estado.

A moldura rola de lado sozinha, então tabela larga não empurra a página.

O nome da tabela entra pelo `TableCaption`, e não por um `<h3>` acima dela: o
título vizinho não nomeia elemento nenhum, e o leitor de tela anuncia só
"tabela, 5 colunas".

A linha de totais entra pelo `TableFooter`, e não por uma `<div>` embaixo da
tabela: dentro do `<tfoot>` a célula divide a largura com a coluna, e o total
fica debaixo do valor que ele soma.

## Quando não usar

Para listagem que vem de uma consulta, use `DataTable`. Ela trata os três
estados que toda consulta tem e quase nenhuma tabela escrita à mão trata
(carregando, erro e vazio) e traz ordenação, busca, paginação e seleção sem
nada disso virar estado da sua tela.

Este aqui fica para a tabela que você desenha: o quadro de valores de um
recibo, a comparação de planos, a linha de totais montada à mão. Quando as
linhas são um `map` sobre o que a API devolveu, é a outra.

## No React Native

Não porta, por decisão - não há tabela no celular; a consulta vira `DataList`. Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de cada uma.
