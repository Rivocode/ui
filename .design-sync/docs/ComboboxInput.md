---
category: Forms
---

# ComboboxInput

The search field with the clear button and the arrow attached. Lives inside `Combobox`.

`className` dresses the root, which here is the frame holding the field and the
two buttons, not the `<input>`. To reach each of them by name, use
`classNames` with the `wrapper` and `input` parts:

```tsx
<ComboboxInput classNames={{ input: "font-mono" }} />
```

That is the difference that set this component apart from `AutocompleteInput`,
which has no frame and therefore dresses the field itself with `className`.
