---
category: Forms
---

# Select

Single choice from a list.

It composes with `SelectTrigger`, `SelectValue`, `SelectContent` and
`SelectItem`. A list with real families gets `SelectGroup` with
`SelectGroupLabel`, and `SelectSeparator` between one family and the next.

**Pass `items` with `{ label, value }` at the root.** Without it the trigger
shows the raw value instead of the label, and that is the easiest trap to fall
into here.

It renders in a portal, so it requires `RivoProvider`.

`size` lives at the root, with `Input`'s vocabulary: `sm`, `md` (default) and
`lg`, with the same height, the same padding and the same body text. The
`SelectTrigger` inside wears the size on its own, so a filter with
`Input size="sm"` and `Select size="sm"` side by side stays on a single line.

```tsx
<Select items={STATUS} size="sm">
  <SelectTrigger aria-label="Status">
    <SelectValue placeholder="Todos" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="abertas">Abertas</SelectItem>
  </SelectContent>
</Select>
```

## When not to use

When the list is too big to fit in the chooser's head, or when it comes from
the server, use `Combobox`: it brings search along. Scrolling through a hundred
and twenty cities in a list with no field to type in is the same work as
rummaging through a drawer.

For two or three options that fit side by side, `RadioGroup` shows them all at
once and saves the click to open. And for an on-off, `Switch`.

## In React Native

Translates, and the way to write it is different. On the web `Select` asks for `items` on the root **and** the four parts (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`); on native it is a single tag (`<Select items={…} value={…} onValueChange={…} label="Período" />`), and the list opens in a bottom sheet, which is the platform's idiom for choosing. `label` is required: it is through it that the screen reader announces the trigger, a role that on the web belonged to `SelectTrigger`.

Families of options come in through the same `items`, in `{ label, items }` groups - the shape the web's `items` also accepts. The sheet becomes a `SectionList`, and each group's `label` is announced as a header, in place of `SelectGroupLabel`.
