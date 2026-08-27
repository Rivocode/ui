---
category: Navegação
---

# Menu

Menu de ações, típico dos três pontinhos de uma linha de tabela.

Compõe com `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuGroup` e
`MenuSeparator`. O título de grupo e a propriedade `label` do `MenuGroup`, não
uma peça separada.

O menu também escolhe, e não só age: `MenuCheckboxItem` liga e desliga uma opção
sem fechar o painel (o "quais colunas mostrar" de uma listagem), e
`MenuRadioGroup` com `MenuRadioItem` faz a escolha única, o "ordenar por". Os
dois trazem o `aria-checked` de item de menu e a navegação por seta e por
primeira letra, que um `Popover` com `Checkbox` dentro não tem.

Quando um ramo merece painel próprio, `MenuSubmenu` com `MenuSubmenuTrigger`
abre ao lado. E o item que navega é `MenuLinkItem`, que sai como `<a>` de
verdade.

`tone="danger"` no item que apaga. Renderiza em portal, então exige o
`RivoProvider`.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Menu` - folha de baixo com `actions`, nunca popup ancorado. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
