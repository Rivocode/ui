---
category: Forms
---

# Textarea

A multi-line field. It goes through Base UI's `Field.Control` like `Input`, so
label, help and error tie themselves together inside a `Field`.

Height here is a number of lines: `rows` says how many the field shows before
scrolling. `size` (`sm`, `md` default and `lg`) is the same as `Input`'s and
does not touch the lines: it changes the side padding, the body text and the
minimum height, which is that of two fields of the same size. It lets a note
fit in the same form as an `Input size="sm"` without clashing with it.

```tsx
<Field>
  <FieldLabel>Observação</FieldLabel>
  <Textarea size="sm" rows={3} />
</Field>
```

## In React Native

Translates: `rows` is the initial height and the field grows with the content, as on the web. The web's `size` does not cross over: it only matches the padding, the text size and the minimum height with the neighboring `Input`, and on native `Input` also has a single height.

The text arrives through `onValueChange`, with the same name as the web and the rest of the native fields. The `TextInput`'s `onChangeText` still works and is called along with it, and it is what `@rivocode/ui-native/form`'s `forText` relies on, the same for `Input` and for `Textarea`.
