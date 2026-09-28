---
category: Structure
---

# DataTable

A table with the three states every listing has and almost none handles:
loading, error and empty.

It knows nothing about React Query, and that is on purpose: three booleans go
in, and it works the same with a hand-written `fetch`, with SWR or with a
server component.

The order matters: error beats loading, and empty only counts after the query
has come back. Without that, a new search over an error flashes "no results"
before showing the problem.

## Sort, search, paginate, select

All opt-in, all client-side, nothing changes for whoever does not ask:

- **`sortable` on the column**: the header becomes a button that cycles
  ascending, descending, unsorted. When `cell` returns JSX, deliver the raw
  value in `value`, otherwise the sort compares whatever is in `row[key]`.
  There is a single arrow and it **turns half a circle** when the direction
  flips, at `--rc-duration-base`: swapping the drawing all at once made the
  flip go unnoticed, and it is what says the list below turned upside down.
- **`filter` on the table**, a controlled global filter: the app puts the
  search field wherever the screen calls for and passes the text; the table
  compares ignoring case and accents ("otica" finds "Ótica"). With no results,
  a discreet row explains. `empty` stays reserved for a query that came back
  empty.
- **`pageSize`**, pagination with a footer: "1–4 de 7" on the left, the pages
  on the right. Filtering or re-sorting goes back to the first page.
- **`selectable`**: a checkbox column on the left, keys from `rowKey`, notice
  in `onValueChange`. Pass `value` to control it from outside, or
  `defaultValue` to only say what it starts with, the same pair as `Tree` and
  `TreeSelect`. The header checkbox checks the visible page, not the whole
  list.

## The totals row

Every Brazilian financial listing ends in "Total: R$ 248,3K". Built in a
`<div>` below the table, that row loses the column alignment (a `<div>` does
not take part in the table layout algorithm and knows the width of none of
them) and, with `maxHeight`, disappears on scroll.

The total is **per column**, and it is the sibling of `cell` one row up: where
`cell` summarizes a row, `total` summarizes the whole column. It takes just one
column declaring `total` for the `<tfoot>` to exist; the others come out
blank, aligned with what is above.

```tsx
const COLUMNS: Column<Invoice>[] = [
  { key: 'number', header: 'Número', total: () => 'Total' },
  { key: 'customer', header: 'Cliente' },
  {
    key: 'amount',
    header: 'Valor',
    align: 'right',
    cell: (invoice) => currencyShort(invoice.amount),
    total: (invoices) => currencyShort(invoices.reduce((sum, i) => sum + i.amount, 0)),
  },
]
```

Right alignment, `hideOnMobile` and sticking to the bottom with `maxHeight`
come for free: the total cell already is that column's cell. **Money comes out
abbreviated**, as in the rest of the house: the full `currency` is for where
the cent is the subject.

**The rows that reach `total` are the ones left after the filter, from all
pages.** The pagination footer next to it already counts that way ("1–4 de 7"
counts what is left of the search), and a total that changed at every page turn
would not be a total of anything. While loading there is no footer (there is
nothing to add up), and neither for a search with no results: the explaining
row already takes up the whole table.

Why not a `footer?: (rows) => ReactNode`: it would hand the problem back to
where it came from. Whoever wrote it would have to build the `<tr>` and the
`<td>` by hand, count the columns hidden on mobile and repeat the alignment of
each one, and getting any of those wrong is having the total off axis again,
now inside a table. For the arrangement a column cannot reach (a cell that
spans two columns, two summary rows), the path is `Table` with `TableFooter`,
which exists precisely for the table you draw.

`classNames.footer` is still the pagination bar below the table, and not this
row: the totals row is dressed by what each column's `total` returns.

## The texts the piece writes

They used to be hard-coded, and none had a prop:

- **`errorTitle`** (default "Não foi possível carregar") and
  **`errorMessage`** are the pair of the error state. A screen that loads three
  listings needs to say which one failed. `ChartContainer` uses the same two
  names.
- **`labels.retry`** (default "Tentar de novo") is the name of the button that
  runs `onRetry`. It exists for the same reason as `errorTitle`, and with the
  same key in the query pieces: without it, a screen in another language came
  out with the title translated and the button in Portuguese.
- **`noResultsMessage`** (default "Nenhum resultado para a busca.") is the
  discreet row for when the filter zeroed out. It is not to be confused with
  `empty`: a filter that zeroed out is not an empty query, and the remedy for
  one (clearing the search) does not work for the other.

`errorTitle`, `errorMessage` and `noResultsMessage` apply the same way in React
Native's `DataList`, with a difference in default: there the error notice was
born as a single line, so `errorTitle` appears only when you pass one. Without
it, `errorMessage` is what speaks.

## Many rows: own scrolling and virtualization

Between "fits on a page" and "send it to the server" there is the middle case,
which is where a log dashboard lives: tens of thousands of rows, and still
sorting and searching need to work. Paginating on the server solves the volume
and costs `sortable` and `filter`: the piece goes back to being a bare table.

```tsx
<DataTable
  data={events}          // 80 thousand rows
  columns={COLUMNS}      // with sortable as you please
  rowKey={(event) => event.id}
  filter={search}
  maxHeight={480}
  virtual
/>
```

They are two props, and they are independent on purpose:

- **`maxHeight`** gives the table a frame with its own scrolling: it scrolls
  inside instead of pushing the page, and the header sticks to the top of that
  frame (`--rc-z-sticky`, below menu, dialog and toast). On its own, it
  virtualizes nothing: every row stays in the DOM, and that is enough up to a
  few thousand.
- **`virtual`** draws only the rows that fit in the frame. It needs
  `maxHeight`: without a height there is nothing to fit into. Do not combine it
  with `pageSize`: paginating already solves the same problem another way.
- **`rowHeight`** (default 44) is the height of the virtualized row, and the
  piece applies it. It is not a guess: the space of what was not drawn comes
  out of that multiplication, and a row that grows makes the scroll promise an
  end that never arrives. In a dense list, or with a two-line cell, pass your
  own.

**It still renders as a real `<table>`.** The common way of virtualizing (each
row in `position: absolute` with `translateY`) would break that: an absolute
row leaves the table layout algorithm, and with it go the shared column width
and the alignment between header and cell. What is left is a grid of `div`
that looks like a table. Here the visible rows stay in normal flow and the
space of what was not drawn becomes two empty rows, one before and one after,
with the missing height. The `<tbody>` still has only `<tr>` as children, and
each `<tr>` only `<td>`.

The empty rows leave the screen reader's flow with `aria-hidden`, and what
carries the right count is the table's `aria-rowcount` plus each row's
`aria-rowindex`, otherwise the list would be announced as "12 rows" in the
middle of eighty thousand.

Whoever sorts, filters or paginates **on the server** already receives the data
ready: show the page that came and put the house `Pagination` outside, and do
not mark `sortable` nor use `filter`, because two sorts disagreeing is worse
than one.

## Waiting is announced

**Waiting is announced out loud.** `aria-busy` on a node without a role is not
read by any screen reader: it describes the state of a region, and only reaches
whoever is already inside it. Whoever was waiting heard silence, and the
arrival of the data, which swaps the whole screen, said nothing either. The
four siblings publish the same live region (`role="status" aria-live="polite"`,
marked with `data-rc-status`), which says "Carregando…" while the query has not
come back and "Conteúdo carregado" when it does. It exists before the text
changes and is the same node from the first state to the last: a region born
with the text already inside triggers no announcement at all.

## Motion

The table body fades in once when it goes from the skeleton to the rows (`animate-appear`, `--rc-duration-base`), as a whole, and not row by row: sorting moves the rows in the DOM, and an animation tied to the row would restart on every header click. With "reduce motion", the rows appear still.

## When not to use

For the table you draw row by row, use `Table`. It composes with `TableRow`,
`TableCell` and `TableFooter`, and accepts any arrangement: a cell that spans
two columns, two summary rows, the layout of a receipt. This one takes
`columns` and `rows`, and that is the trade: it handles the states and the
sorting, and in exchange the drawing of each row has to fit within what a
column can do.

## In React Native

Becomes `DataList`. A table does not exist on the phone: what crosses over is the state machine (loading, error, empty, data) in the same order, with error winning over loading and empty counting only after the response has arrived. The texts of those endings are configured with the web's names: `errorTitle`, `errorMessage`, `labels.retry` and `noResultsMessage`, all `string` because text here lives inside a `Text`. Only the default of `errorTitle` differs: here there is none, because the list's alert was born as a single line, and that line is `errorMessage`. Of the four opt-ins from here, two port with the same prop name (`filter` and `selectable`, with the selection in `value` and `onValueChange`) and **two do not port by design**: sorting and `pageSize`. A clickable header does not exist without a header, and on the phone sorting is a "sort by" `Menu` that the screen builds on top of the list. In place of the columns, `renderItem`. And that is why `filter` wants a `filterValue`, since nobody can read text from inside the JSX you return.
