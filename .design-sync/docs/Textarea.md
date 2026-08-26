---
category: Formulário
---

# Textarea

Campo de várias linhas. Passa pelo `Field.Control` da Base UI como o `Input`,
então rótulo, ajuda e erro se ligam sozinhos dentro de um `Field`.

Não tem variante de tamanho: altura aqui e número de linhas, e misturar isso com
a escala de controle criaria um `lg` que não quer dizer nada.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Textarea` — `rows` é a altura inicial; o campo cresce com o conteúdo. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
