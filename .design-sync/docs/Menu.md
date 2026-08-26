---
category: Navegação
---

# Menu

Menu de ações, típico dos três pontinhos de uma linha de tabela.

Compõe com `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuGroup` e
`MenuSeparator`. O título de grupo e a propriedade `label` do `MenuGroup`, não
uma peça separada.

`tone="danger"` no item que apaga. Renderiza em portal, então exige o
`RivoProvider`.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Menu` — folha de baixo com `actions`, nunca popup ancorado. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
