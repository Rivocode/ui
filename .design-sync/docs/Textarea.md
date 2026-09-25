---
category: Formulário
---

# Textarea

Campo de várias linhas. Passa pelo `Field.Control` da Base UI como o `Input`,
então rótulo, ajuda e erro se ligam sozinhos dentro de um `Field`.

Altura aqui é número de linhas: `rows` diz quantas o campo mostra antes de rolar.
O `size` (`sm`, `md` padrão e `lg`) é o mesmo do `Input` e não mexe nas linhas:
muda o recuo lateral, o corpo do texto e a altura mínima, que é a de dois campos
do mesmo tamanho. Serve para a observação caber no mesmo formulário que um
`Input size="sm"` sem destoar dele.

```tsx
<Field>
  <FieldLabel>Observação</FieldLabel>
  <Textarea size="sm" rows={3} />
</Field>
```

## No React Native

Traduz: `rows` é a altura inicial e o campo cresce com o conteúdo, como no web. O `size` do web não atravessa: ele só casa o recuo, o corpo do texto e a altura mínima com o `Input` vizinho, e no nativo o `Input` também tem uma altura só.

O texto chega por `onValueChange`, com o mesmo nome do web e do resto dos campos nativos. O `onChangeText` do `TextInput` continua valendo e é chamado junto, e é nele que o `forText` do `@rivocode/ui-native/form` se apoia, igual para o `Input` e para o `Textarea`.
