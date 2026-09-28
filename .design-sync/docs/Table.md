---
category: Structure
---

# Table

A semantic table, with a real `<table>`.

It composes with `TableCaption`, `TableHeader`, `TableBody`, `TableFooter`,
`TableRow`, `TableHead` and `TableCell`.

`selected` on the row draws an accent bar on the side and opens the first cell
with a text marker only the screen reader hears: "Selecionada", replaceable
through `labels.selected`. Color alone is not state.

It does not mark `aria-selected`. That attribute is only valid inside `grid` or
`treegrid`; in a plain `<table>` the browser discards it, and the state never
reaches the reader. Becoming a `grid` would cost a lot: `grid` requires arrow
navigation between cells, which this piece does not implement. The text marker
delivers the state without promising a keyboard that does not exist.

The frame scrolls sideways on its own, so a wide table does not push the page.

The table's name comes in through `TableCaption`, and not through an `<h3>`
above it: the neighboring heading names no element at all, and the screen
reader announces only "table, 5 columns".

The totals row comes in through `TableFooter`, and not through a `<div>` below
the table: inside the `<tfoot>` the cell shares its width with the column, and
the total sits below the value it sums.

## When not to use

For a listing that comes from a query, use `DataTable`. It handles the three
states every query has and almost no hand-written table handles (loading, error
and empty) and brings sorting, search, pagination and selection without any of
that becoming state on your screen.

This one is for the table you design: the values of a receipt, a plan
comparison, a hand-built totals row. When the rows are a `map` over what the
API returned, it is the other one.

## In React Native

Does not port, by decision - there is no table on the phone; the query becomes `DataList`. It is not queued: it will not exist. The [parity table](/react-native) gives the reason for each one.
