---
category: Structure
---

# Stack

Stacks its children in one direction, with the gap between them taken from the
house scale.

```tsx
<Stack gap="lg">
  <Field name="razao">…</Field>
  <Field name="cnpj">…</Field>
  <Stack direction="row" gap="sm" justify="end">
    <Button variant="secondary">Cancelar</Button>
    <Button>Salvar</Button>
  </Stack>
</Stack>
```

`direction` chooses the axis: `column`, the default, puts one below the other;
`row` puts them side by side. `align` aligns on the cross axis and `justify`
distributes on the main axis, with `between` pushing the first and the last to
the ends. `wrap` lets the row wrap when the children do not fit, which is the
case of a row of badges or chips.

## The gap is a scale, and it follows density

`gap` does not accept pixels. There are five steps, plus `none`:

| Step | Comfortable | Compact |
| ----- | ----------- | -------- |
| `xs`  | 4px         | 4px      |
| `sm`  | 8px         | 6px      |
| `md`  | 12px        | 8px      |
| `lg`  | 16px        | 12px     |
| `xl`  | 24px        | 16px     |

The default is `md`. The steps come from the `--rc-gap-*` tokens, which density
rewrites along with the control height: a screen that switches to
`density="compact"` also tightens the gap between blocks, not just the controls
inside them. A hand-written `gap-3` stays at 12px in both.

`xs` does not shrink. Below 4px, badge against badge becomes a single word.

## Another element

`render` swaps the element without changing the arrangement. A list stays a
list for the screen reader, which announces how many items it has:

```tsx
<Stack render={<ul />} gap="sm">
  <li>Nota 4813, autorizada</li>
  <li>Nota 4814, autorizada</li>
</Stack>
```

## When not to use

- **When a `div` with a class is enough.** Two elements that align once, in a
  single place, do not call for a piece: `flex items-center gap-2` says the
  same thing. `Stack` pays for itself where the gap needs to follow density, or
  where the same arrangement repeats screen after screen and each one would
  pick a different number.
- **A two-dimensional grid.** Cards arranged in columns and rows are `Grid`,
  with `columns` or `minItemWidth`. A `Stack` with `wrap` wraps the row, but
  does not align the columns of one row with those of the next.
- **Frame and inner padding.** `Stack` draws no border and no background. The
  framed block is `Card`, and the top of the screen, with title and actions, is
  `PageHeader`.
- **Two areas the person resizes.** List and detail with a draggable divider
  are `Splitter`.

## In React Native

Translates: `@rivocode/ui-native` exports `Stack` - same props, minus `render`; the gap is the comfortable scale, because on touch there is no compact density. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
