---
category: Feedback
---

# EmptyState

Estado vazio, com saída.

`title` e `description` sao obrigatorias, e `action` e fortemente recomendada.
Uma tela que só diz "nenhum resultado" empurra para a pessoa o trabalho de
adivinhar o que fazer.

Distinga os dois vazios: primeiro uso ("emita a primeira nota") pede ação de
criacao; busca sem resultado ("nada para esse filtro") pede ação de limpar
filtro.

`title` e `description` aceitam nó, e não só texto (como no `PageHeader` e no
`Timeline`). Um número já formatado ou um `<strong>` no meio da frase cabem:
"Nenhuma nota em **março**".

O `empty` do `DataTable` e o do `ChartContainer` são este mesmo objeto:
`title`, `description`, `action` e `icon`.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `EmptyState` - `description` obrigatória, pelo mesmo motivo do web. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
