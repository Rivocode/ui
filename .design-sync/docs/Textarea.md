---
category: Formulário
---

# Textarea

Campo de várias linhas. Passa pelo `Field.Control` da Base UI como o `Input`,
então rótulo, ajuda e erro se ligam sozinhos dentro de um `Field`.

Não tem variante de tamanho: altura aqui e número de linhas, e misturar isso com
a escala de controle criaria um `lg` que não quer dizer nada.

## No React Native

Traduz: `rows` é a altura inicial e o campo cresce com o conteúdo, como no web, que também não tem variante de tamanho.

**`onChangeText`, e não `onValueChange`, e isso é o par e não o desvio.** No catálogo nativo `onValueChange` é de quem é dono do valor: `Select`, `Combobox`, `Slider`, `Calendar`, `MaskedInput`, `SearchInput`, `InputGroup`, todas leem o texto cru e entregam outra coisa. `Input` e `Textarea` não entregam outra coisa: são o `TextInput` da plataforma com a borda da casa, e o `TextInput` chama `onChangeText` com a string.

A regra é essa, e vale para as duas: **campo cru fala `onChangeText`; peça que transforma o valor fala `onValueChange`**. Dar `onValueChange` só ao `Textarea` quebraria o par com o `Input`, que é o que o `Field` alterna sem a tela mudar de contrato, e deixaria o `forText` (o quarto adaptador do `@rivocode/ui-native/form`, que existe exatamente para esses dois) certo para um e errado para o outro.
