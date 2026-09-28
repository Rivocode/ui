---
category: Forms
---

# Combobox

A choice from a long list, with search.

Use it when the list is too big to fit in the chooser's head, or when it comes
from the server.

Composes with `ComboboxInput`, `ComboboxContent`, `ComboboxList` and
`ComboboxItem`. A list with real families gets `ComboboxGroup`,
`ComboboxGroupLabel` and `ComboboxSeparator` between one family and the next.

With `multiple`, the selection becomes chips inside the field itself:
`ComboboxChips` around it, `ComboboxValue` to know what is selected and one
`ComboboxChip` per selection.

`size` lives on the root, with the `Input` vocabulary: `sm`, `md` (default) and
`lg`, with the same height, the same padding and the same text size. The
`ComboboxInput` inside takes the size on its own.

```tsx
<Combobox items={CLIENTES} size="sm">
  <ComboboxInput aria-label="Cliente" placeholder="Buscar cliente" />
</Combobox>
```

## When not to use

With five fixed options, use `Select`: it costs less, asks for no typing and
has no "nothing found" state to handle. Search on a list the person can see
in full only adds a keyboard in the way.

When what the person types **also counts** (a city that is not on the list, a
search term), use `Autocomplete`. Here the list rules: the final value has to
be one of the options, and text that matches none of them is lost when the
field loses focus.

And do not use it to navigate. A search field that leads to another screen is
`Command`, the palette. The combobox returns a value to a form, and whoever
chooses in it expects the choice to stay written there, not the page to
change.

## In React Native

Translates: `@rivocode/ui-native` exports `Combobox` - the list opens in a sheet with accent-insensitive search, and the sheet rises with the keyboard; `items` on the root, flat or in `{ label, items }` groups, not a `ComboboxItem` per child. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
