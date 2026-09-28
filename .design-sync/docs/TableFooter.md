---
category: Structure
---

# TableFooter

The table's footer, in a real `<tfoot>`. It is where the totals row lives.

Every financial listing here ends in "Total: R$ 248,3K", and until now that row
was a `<div>` below the table. A `<div>` does not take part in the table layout
algorithm: it knows the width of no column, so the total never sits below the
value it sums. And, in a table with its own frame, it scrolls away along with
the content.

Inside the table both things solve themselves: the cell shares its width with
the column, and the footer can stick to the bottom through the same mechanism
with which `TableHeader` sticks to the top.

```tsx
<Table>
  <TableHeader>…</TableHeader>
  <TableBody>…</TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell className="text-right font-mono">{currencyShort(total)}</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

The weight is intentional: the footer is a summary, and a summary cannot read
as one more data row.

**Money comes out abbreviated**, as in the rest of the house: `currencyShort`,
not the full value. `currency` is for where the cent is the subject: the amount
the person confirms before issuing, and the receipt afterwards.

To stick the footer in a table that scrolls inside, `sticky` goes in the class,
with the family's stacking step:

```tsx
<TableFooter className="sticky bottom-0 z-[var(--rc-z-sticky)] bg-surface">
```

The background is not optional: without it the row passing underneath shows
through the footer.

## When not to use

In a listing that comes from a query, do not build the `<tfoot>` by hand:
`DataTable` produces the row on its own, from each column's `total`, and there
it already knows which rows to sum, which column to hide on the phone and when
to stick.
