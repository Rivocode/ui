---
category: Structure
---

# TableCaption

The table's caption, in a real `<caption>`. It is the name the screen reader
announces before entering the rows.

It goes **inside** `Table`, and as the first child:

```tsx
<Table>
  <TableCaption>Notas emitidas em junho de 2025</TableCaption>
  <TableHeader>…</TableHeader>
  <TableBody>…</TableBody>
  <TableFooter>…</TableFooter>
</Table>
```

The instinct is to write that title in a `<p>` or an `<h3>` right above the
table. It breaks nothing, and it costs the whole name: the announcement becomes
"table, 5 columns, 12 rows" and nothing else, because neighboring text names no
element at all. On a screen with two tables (the invoices and the payments),
whoever navigates by the list of tables hears both with the same name, which is
no name.

And there is no middle ground: `<caption>` has no legal parent other than
`<table>`. Loose next to `Table`, where the title seems to fit better, React
brings the screen down:

```
In HTML, <caption> cannot be a child of <div>. This will cause a hydration error.
```

Either it is a child of the `<table>`, or it is not a caption.

When the table already has a title on the page, the caption is still worth it
as a name, just without taking up a single pixel:

```tsx
<TableCaption className="sr-only">Notas emitidas em junho de 2025</TableCaption>
```

That is what `DataTable` does with its `caption`.

The caption comes out on top. To send it below the table, `caption-bottom` in
the class. The piece's `caption-top` steps aside on its own.

## When not to use

In a listing that comes from a query, do not build the `<caption>` by hand:
`DataTable` receives the caption through the `caption` prop, and already writes
it inside the right `<table>` (including in the fixed-height variant, where the
table is a different one).

For the visible title that heads the whole section, with an action beside it,
it is `PageHeader`, not the caption: `TableCaption` names the table, not the
screen.
