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

## No React Native

Traduz: o `@rivocode/ui-native` exporta `EmptyState` — `description` obrigatória, pelo mesmo motivo do web. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
