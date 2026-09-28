---
category: Navigation
---

# Pagination

Navigation between the pages of a listing.

The list of numbers shrinks on its own, so it takes the same width with ten or
with ten thousand pages. On a phone the numbers disappear and only the arrows
remain, with "3 de 12": a 32px target misses its neighbor, and one almost
always wants the next one.

`onPageChange` receives the new page, counting from 1; whoever called it is
the one who changes `page`. The texts live in `labels`: `navigation` is the
name of the region, `previous` and `next` those of the arrows, `page` that of
each number and `position` the "3 de 12" of the narrow screen. In a
`DataTable` with `pageSize`, they arrive through `labels.pagination`.

At the edges the piece does not lie: `pageCount` below 1 counts as one page, a
`page` out of range shows clamped to it (9 of 5 renders "5 de 5", with 5
selected and the back arrow going to 4), and with a single page both arrows
are locked.

## In React Native

Does not port, by decision - a phone list scrolls; choosing the page number is a desktop gesture. It is not queued: it will not exist. The [parity table](/react-native) gives the reason for each one.
