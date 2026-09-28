---
category: Forms
---

# ComboboxChip

One selection, with the x to remove it.

The x inside says what gets removed. When the chip is text, the name comes
ready from its own content ("Remover Clínica São Lucas"), and when it is not (an
`Avatar`, a `Badge`), the chip's `aria-label` answers. Without one of the two
the screen reader reads a row of "Remover, Remover, Remover", and WCAG 2.4.6
asks that the name distinguish.

`labels.remove` takes the chip's text and returns the name, to change the verb
or translate it:

```tsx
<ComboboxChip labels={{ remove: (label) => `Tirar ${label} da seleção` }}>
  Clínica São Lucas
</ComboboxChip>
```
