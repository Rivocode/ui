---
category: Formulário
---

# Combobox

Escolha em lista longa, com busca.

Use quando a lista é grande demais para caber na cabeça de quem escolhe, ou
quando ela vem do servidor.

Compõe com `ComboboxInput`, `ComboboxContent`, `ComboboxList` e
`ComboboxItem`. Lista com famílias de verdade ganha `ComboboxGroup` e
`ComboboxGroupLabel`.

Com `multiple`, a escolha vira fichas dentro do próprio campo: `ComboboxChips`
em volta, `ComboboxValue` para saber o que está escolhido e um `ComboboxChip`
por escolha.

## Quando não usar

Com cinco opções fixas, use `Select`: ele custa menos, não pede digitação e não
tem estado de "nada encontrado" para tratar. Busca numa lista que a pessoa
enxerga inteira só acrescenta um teclado no caminho.

Quando o que a pessoa digita **também vale** — uma cidade que não está na lista,
um termo de busca — use `Autocomplete`. Aqui a lista manda: o valor final tem
que ser uma das opções, e texto que não casa com nenhuma se perde ao sair do
campo.

E não use para navegar. Campo com busca que leva a outra tela é `Command`, a
paleta — o combobox devolve um valor a um formulário, e quem escolhe nele espera
que a escolha fique escrita ali, não que a página troque.
