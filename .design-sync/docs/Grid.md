---
category: Structure
---

# Grid

Lays the children out in rows and columns, with the same gap as `Stack`.

```tsx
<Grid minItemWidth="12rem">
  {clientes.map((cliente) => (
    <Card key={cliente.id}>…</Card>
  ))}
</Grid>
```

There are two ways to state the columns, and the choice is the question the
screen asks.

**`minItemWidth`: as many as fit.** The grid places as many columns as fit
with at least that width and splits the leftover among them. On a phone you
get one column, on a laptop three, on a wide monitor five, with no
hand-written media query. It accepts a number, read in pixels, or a CSS
length such as `"16rem"`. On a screen narrower than the minimum itself, the
item takes the whole row instead of overflowing sideways.

**`columns`: as many as I say.** Fixed columns of equal width. Useful when the
number of columns is part of the design, like three indicators side by side on
a dashboard. It does not change with the screen, so check it at 390px before
choosing it.

A fixed column does not protect content that does not wrap. Each column
shrinks until it fits the screen, but what is inside it does not: a `Badge`, a
button and a number in a mono font stay on a single line and run over the
neighboring column. Three `Badge` with counts in `columns={3}` overlap on a
390px phone. For items that do not wrap, use `minItemWidth`, which drops to
fewer columns when width runs out, or a row `Stack` with `wrap`.

The two together do not combine, and `minItemWidth` wins. With neither, you
get a single column, with the gap between the rows.

The last row does not stretch. With five cards in three columns, the two at
the bottom stay the size of the ones above, and the third slot stays empty: a
card that changes width depending on the count looks like a bug.

`gap` is the same scale as [`Stack`](/componentes/stack), from `xs` to `xl`,
with the same smaller step in compact density. `render` swaps the element, as
there: `<Grid render={<ul />}>` keeps the list for the screen reader.

## When not to use

- **When a `div` with a class is enough.** A two-column grid that only shows
  on desktop is `grid gap-4 lg:grid-cols-2`, and nobody gains anything from the
  piece. `Grid` pays for itself with `minItemWidth`, which Tailwind cannot
  write without an arbitrary value, and with the gap that follows density.
- **A single direction.** Fields one below the other, or buttons side by side,
  are `Stack`.
- **Data in rows and columns.** Invoice, customer and amount aligned by
  column, with a header, are `Table` or `DataTable`: the screen reader
  announces the column of each cell, and the grid announces nothing.
- **Columns the person resizes.** List and detail with a divider are the
  `Splitter`. The frame of each item is still the `Card`, which `Grid` does not
  draw.

## In React Native

Translates: `@rivocode/ui-native` exports `Grid` - `columns`, `minItemWidth` in points and `gap`; the grid measures its own width to count the columns. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
