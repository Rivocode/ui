---
category: Forms
---

# Autocomplete

A field that suggests as you type, and accepts what is not on the list.

**The panel is the same as Combobox's.** Use `ComboboxContent`, `ComboboxList`
and `ComboboxItem` inside it; only the field changes, to `AutocompleteInput`.

```tsx
<Autocomplete items={CIDADES}>
  <AutocompleteInput placeholder="Cidade" />
  <ComboboxContent emptyMessage="Nenhuma cidade com esse nome.">
    <ComboboxList>
      {(cidade: string) => (
        <ComboboxItem key={cidade} value={cidade}>
          {cidade}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Autocomplete>
```

## When not to use

When the value **has to** be one of the options (the invoice's customer, the
ledger account, the unit of measure), use `Combobox`. That is the difference
between the two: there the list rules, here the suggestion helps and free text
counts. Letting "Clínica São Lucaz" through in a field that should point to a
registered record is a mistake that only shows up in the next month's report.

## In React Native

Translates, and what is specific to `Autocomplete` came along: `value` is the typed text, and what is not in the list counts. On native it is controlled (`value` and `onValueChange` required) and the suggestions come in through `items` on the root, as text, flat or in `{ label, items }` groups - in place of `AutocompleteInput` with the `Combobox` panel as a child. `label` is required: it is the name the screen reader announces and the sheet's title.

The field opens in a bottom sheet, with the text at the top and the suggestions right below, and not in a list attached to the field. The keyboard is what decides this: when open, it covers the bottom half of the screen, and the list of a field at the foot of the form would be born hidden. The sheet rises with it, like the `Combobox`'s. Each keystroke reaches `onValueChange`, tapping a suggestion fills the text and closes, and **Concluir** closes with what was typed. The suggestion count is announced on each change, like the web's live region. There is no inline completion: `mode` does not exist.
