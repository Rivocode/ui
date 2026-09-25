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

O texto chega por `onValueChange`, com o mesmo nome do web e do resto dos campos nativos. O `onChangeText` do `TextInput` continua valendo e é chamado junto, e é nele que o `forText` do `@rivocode/ui-native/form` se apoia, igual para o `Input` e para o `Textarea`.
