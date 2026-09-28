---
category: Structure
---

# VirtualList

A long list that draws only what fits in the frame.

The virtualizer was already paid for: `DataTable` has used the same machinery
since the log panel came in. What was missing was the list that is not a table
(the feed, the event history, the picker of two thousand clients), which until
now either mounted ten thousand `<li>`s in the DOM or pushed the person toward
server-side pagination.

```tsx
<VirtualList
  items={events}            // 4 thousand items
  itemKey={(event) => event.id}
  maxHeight={360}
  label="Log de envio de notas"
  renderItem={(event) => (
    <Item className="px-3">
      <ItemContent>
        <ItemTitle>{event.message}</ItemTitle>
        <ItemDescription>{event.at}</ItemDescription>
      </ItemContent>
    </Item>
  )}
/>
```

`renderItem` draws one item; the piece takes care of how many exist, which ones
are on the screen and how much space the absent ones take up.

## From how many items

**Below two hundred, do not use it.** A short virtualized list is complexity
paid for with no return: in come a required height, a height guess per item and
a container that scrolls inside, and what you gain is a few milliseconds nobody
feels. Two hundred ordinary rows mount in less than a frame.

Between two hundred and about two thousand, it is a choice: if each item is
heavy (an image, a chart, a menu per row), virtualizing already pays; if it is
text, it does not.

**Above two thousand, use it.** That is where the initial mount starts freezing
the click that opened the screen, and it is the point at which a `ScrollArea`
with everything in the DOM starts costing real memory on the phone.

## The item height, which is the piece's decision

Virtualizing means promising, before drawing, how much space what was not drawn
will take. The whole piece comes from that.

- **`itemHeight`** (default 44, the same as `DataTable`'s `rowHeight`) is the
  guess. It is what gives the scrollbar its length before the item exists. It
  accepts a number or a function by index, for a list that alternates single
  and double items.
- **`measure`** (on out of the box) makes each drawn item report its real
  height, and the scroll correct itself. It is what holds text that wraps to
  two lines at 390px: with the guess alone, the two-line item overlaps the one
  below and the scrollbar promises an end that never comes.

With `measure` on, `itemHeight` only needs to be close: whoever has not been
drawn yet still counts at the guess, and whatever has passed through the screen
counts at its measurement. That is why the scrollbar of a list with varied
heights adjusts while scrolling, and that is honest: the alternative would be
measuring four thousand items on mount, which is exactly the cost the piece
exists to avoid.

**Turn `measure` off when the height is fixed by CSS.** Then `itemHeight` is the
law, the piece applies that height to each item, and you save one resize
observer per visible item. It is the case of a fixed-width log with one line
per event.

`itemKey` is not just a React key: it is how the measured height follows the
item when the list reorders or filters. The index works and breaks on the first
reorder: the item that was third inherits the height of whoever was there.

## Scrolling inside its own frame

`maxHeight` is required, and that is the difference from its `DataTable`
sibling, where it is optional: without a height there is nothing to fit into,
and a virtualized list without a frame draws a single item. The frame is the
same as the table's (same border, corner and surface), it scrolls inside instead
of pushing the page, and it has been a written house decision since the table.

`gap` puts spacing between one item and the next without it counting as item
height. A margin inside `renderItem` does not work: an item's measurement is
its box, and the margin stays outside. The result is a list that shrinks a
little with each item.

## The count for the screen reader

A virtualized list lies by construction: with twenty items in the DOM and four
thousand in hand, the screen reader announces "item 3 of 20". `DataTable` solved
this with `aria-rowcount` on the table and `aria-rowindex` on each row; here
the equivalent list pair applies: **`aria-setsize` with the total and
`aria-posinset` with the real position** on each item. Whoever listens hears "3
of 4000", which is what exists.

The piece comes out as `role="list"` with `role="listitem"` inside, and `label`
is that list's name. Without it, it is announced as an unnamed list in the
middle of the screen. And on a screen that has three, that tells none of them
apart.

While loading there is no list at all: the skeleton comes out marked with
`aria-hidden` and the region does not announce itself as a list of four items
that do not exist.

## Going to an item that is not on the screen

An item that was not drawn has no element, so `scrollIntoView` cannot reach it.
`ref` receives a `VirtualListHandle`, which has
`scrollToIndex(index, { align })`: `start`, `center`, `end` or `auto`. It is how
you go to the end of a log or jump to a search result.

```tsx
const list = useRef<VirtualListHandle>(null)

<Button onClick={() => list.current?.scrollToIndex(events.length - 1, { align: 'end' })}>
  Último
</Button>
<VirtualList ref={list} items={events} /* … */ />
```

## The four states

The same as `DataTable`'s, in the same order and with the same prop names: error
beats loading, and empty only counts after the query has returned. `isLoading`
and `items === undefined` are the same thing; `skeletonItems` says how many fake
items appear, and each one takes up the `itemHeight` height, so the frame does
not jump when the data arrives. `errorTitle`, `errorMessage`, `onRetry` and
`labels.retry` are the error set, and `empty` is the empty state with a required
description. `labels.retry` (default "Tentar de novo") names the retry button,
and has the same key and the same default across the query pieces: translating
the title without being able to translate the button is worse than translating
nothing.

**The wait announces itself out loud.** `aria-busy` on a node without a role
is read by no screen reader at all: it describes the state of a region, and
only reaches whoever is already inside it. Whoever was waiting heard silence,
and the arrival of the data, which swaps the whole screen, said nothing either.
The four siblings publish the same live region (`role="status"
aria-live="polite"`, marked with `data-rc-status`), which says "Carregando…"
while the query has not returned and "Conteúdo carregado" when it returns. It
exists before the text changes and is the same node from the first state to the
last: a region that is born with the text already inside fires no announcement
at all.

## Parts

`classNames` dresses each part without anyone reaching the inner node through
`[&>div>div]`:

- **`list`**: the full-height strip that scrolls inside the frame.
- **`item`**: each item's positioned box, where whatever `renderItem` returns
  goes.

`className` is still the frame, and it is where you remove the border when the
list is made of loose cards.

## The interactive item comes from `renderItem`

There is no `onItemClick`. A `<div>` that responds to a click does not respond
to Enter, and a list of a thousand of those is a thousand targets the keyboard
cannot reach. Whoever needs a clickable item returns the real target:
`<Item interactive render={<a />}>` or `<Item interactive render={<button />}>`,
which already bring visible focus and hover color.

## When not to use

**If the data is tabular, use `DataTable`.** It already virtualizes
(`maxHeight` plus `virtual`), and brings along what a list does not have: a
column with a header, sorting, an accent-insensitive filter, selection and a
totals row aligned with the columns. An invoice listing built with
`VirtualList` is a table rebuilt by hand, and the first thing lost is the
alignment between columns.

**If the list is short, use `ScrollArea`.** It is the scrolling frame with no
virtualization at all: no item height, no guess, no `aria-setsize`. For the
thirty invoices of a side panel, it is the right piece, and `VirtualList` there
only adds one more required prop and a height for you to guess.

## In React Native

Does not port, and it is not queued: **the platform already solves it**. React Native's `FlatList` virtualizes out of the box, and the `DataList` here already uses it underneath. A piece of ours on top would be a wrapper of a wrapper, and would demand maintenance to reimplement what the system delivers, with worse performance, because `FlatList` runs part of the work off the JavaScript bridge.

What the web had of its own, and that `FlatList` does not give by itself, are the four endings and the honest count for the screen reader. Both are already in `DataList`: use it for a long list that came from a query, and raw `FlatList` for a long list you already have in hand.
