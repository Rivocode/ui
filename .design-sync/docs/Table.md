---
category: Estrutura
---

# Table

Tabela semântica, com `<table>` de verdade.

Compõe com `TableHeader`, `TableBody`, `TableRow`, `TableHead` e `TableCell`.

`selected` na linha marca no `aria-selected` e desenha uma barra de acento na
lateral. Cor sozinha não é estado.

A moldura rola de lado sozinha, então tabela larga não empurra a página.

## Quando não usar

Para listagem que vem de uma consulta, use `DataTable`. Ela trata os três
estados que toda consulta tem e quase nenhuma tabela escrita à mão trata —
carregando, erro e vazio — e traz ordenação, busca, paginação e seleção sem
nada disso virar estado da sua tela.

Este aqui fica para a tabela que você desenha: o quadro de valores de um
recibo, a comparação de planos, a linha de totais montada à mão. Quando as
linhas são um `map` sobre o que a API devolveu, é a outra.
