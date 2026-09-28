---
category: Feedback
---

# QueryBoundary

The four endings of a query (loading, error, empty and data) around any
content.

`DataTable` and `ChartContainer` already have them built in, and the rest of
the screen does not: every summary card, every details sheet and every
hand-drawn list rewrites the same ladder of `if`s. This piece is that ladder,
with the same prop names as those two: `isLoading`, `isError`, `onRetry`,
`errorTitle`, `errorMessage` and `empty`.

```tsx
<QueryBoundary
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  empty={{
    title: 'Nenhuma nota por aqui',
    description: 'Quando você emitir a primeira, ela aparece nesta lista.',
  }}
>
  {(invoices) => <Invoices invoices={invoices} />}
</QueryBoundary>
```

It does not know React Query, and that is on purpose: three booleans and a
response go in, and it works the same with hand-written `fetch`, with SWR or
with a server component.

**The order is the same as its two siblings':** error beats loading, and empty
only counts after the response has arrived. Without that, a new fetch over an
error flashes "no results" before showing the problem.

## The child can be a function

As a function, it is only called after the data has arrived, and it receives
`data` without the `undefined`, which is exactly the `!` every screen used to
write here. As a node, it serves whoever does not need the data to draw:

```tsx
<QueryBoundary data={customer}>
  {(customer) => <DescriptionItem label="Cliente">{customer.name}</DescriptionItem>}
</QueryBoundary>
```

With a function child, undefined `data` is still waiting even with
`isLoading={false}`. There is nothing to hand to the function, and it is the
`DataTable` rule. With a node child, `isLoading` rules alone when you pass it:
the node does not depend on the data to exist.

The function does not cross a server component boundary: it is not
serializable. From a server component, pass the child as a node.

**The children come out as you wrote them, unwrapped.** The piece does not put
a `<div>` around what it returns: an invisible frame would break the `grid` or
the `flex` of whoever is outside, and the defect would only show up in the
browser.

## The wait

The default is three lines of `Skeleton`, and they hold height without
promising any shape. `skeletonRows` changes how many, the same name as in
`DataTable`.

When the shape of what is coming matters (and it almost always does), pass
your own mold in `skeleton`:

```tsx
<QueryBoundary
  isLoading={query.isLoading}
  skeleton={
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-24" />
    </div>
  }
>
```

It is not a `Spinner` on purpose, and it is the same choice as its two
siblings: a spin in the middle of the void reserves no height, so the page
jumps when the content arrives. `Spinner` is still the right thing for a wait
that has no shape: the button that submits, the action that draws nothing.

The loading node comes out with `aria-busy="true"`. `Skeleton` hides from the
screen reader on purpose, and the container is where the loading notice
belongs.

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

## What it does not handle: stale data while revalidating

`isLoading` and `isError` describe two situations, and the most common case on
a real screen is a third one: **there is already data on the screen and a new
fetch is running.** If you pass `isFetching` into `isLoading`, the skeleton
covers what the person was reading; if you pass nothing, the update happens
with no signal at all.

The piece does not solve this today, and the choice is yours:

```tsx
<QueryBoundary isLoading={query.isLoading} isError={query.isError} data={query.data}>
  {(rows) => (
    <div aria-busy={query.isFetching}>
      <DataTable rows={rows} />
    </div>
  )}
</QueryBoundary>
```

TanStack Query's `isLoading` is true only on the first fetch, which is what the
piece expects. `isFetching` is true on every fetch, including the one that
revalidates - so it does not serve for `isLoading`, and it does serve for
`aria-busy`.

## Who decides empty

The piece decides on its own, from `data`: **a zero-length list and `null` are
empty**, and `undefined` is "not here yet". Without `isLoading`, it is what
turns loading on.

For a response that is not a list (`{ items: [], total: 0 }` is the usual
paginated one), the answer comes from `isEmpty`, which beats the count when it
is present:

```tsx
<QueryBoundary data={page} isEmpty={page.total === 0} empty={{ ... }}>
```

If `empty` arrives with nothing able to decide, the piece warns in the console
in development. An empty state that never shows is silent: the children draw
over nothing, and nobody finds out until a client opens the screen without
data.

Without `empty`, there is no empty state. The empty response falls to the
children, and they draw their own empty. The exception is `null` with a
function child: with no data to hand over and no empty configured, the piece
draws nothing.

The description is required for the same reason as in `DataTable`: "no
results" hands the person the work of finding out why, and they almost never
do.

## The texts the piece writes

`errorTitle` (default "Não foi possível carregar") and `errorMessage` (default
"Tente de novo em alguns minutos.") are the pair for the error state, with the
same names and the same role they have in `DataTable` and `ChartContainer`: a
screen that loads three blocks needs to say which one failed, and a product
that does not speak Portuguese needs to say it in another language.

`labels.retry` (default "Tentar de novo") is the name of the button that runs
`onRetry`, and exists for the same reason: without it, the translated screen
came out with the title in English and the button in Portuguese, which is worse
than everything in Portuguese. The key and the default are the same across the
query pieces, and `labels.loading` and `labels.loaded` change what the screen
reader hears when the query goes out and when it comes back.

Without `onRetry` there is no retry button. A notice with a button that leads
nowhere is worse than a notice with no button.

## Motion

The error `Alert` and the empty `EmptyState` enter with their own motion. The content you hand over gets no entrance from here: the frame does not wrap your children in a box, because an extra box changes the layout of whoever uses it (the child that was `flex-1`, the grid item). Whoever has a box of their own enters on their own: `DataTable` fades its body in, and the chart draws itself.

## Parts

`classNames` dresses each ending: `loading`, `error`, `empty`. `className`
dresses all three at once, which is where the frame that reserves the height
lives (`className="min-h-40"`). And it does not dress the children, which are
yours.

## When not to use

**Do not wrap `DataTable` or `ChartContainer`.** Both already receive the four
endings, with these same props, and draw the wait in the shape of what they
show: fake table rows, fake chart bars. From outside, a frame would only have a
generic skeleton to offer, and the two error states would stack up together
the day the query failed.

For the empty state alone (a screen that never loads anything, a result already
in hand), use `EmptyState`. For an error notice that is not the end of a query,
`Alert`. For a loose placeholder inside a block that already handles the other
endings, `Skeleton`. This piece exists for the four together, and in order;
just one of them does not pay for the wrapper.

It also does not catch render exceptions: `QueryBoundary` shows the error the
query reported in `isError`, not what blew up inside the children. For that,
what exists is React's error boundary.

## In React Native

Translates with the same prop names and the same order: **error wins over loading**, and empty only counts after the response has arrived. `children` also accepts a function here, which is what justifies the piece existing: it delivers the data already without `undefined`, and kills the `!` the screen used to write.

Four type differences, all because text on native lives inside a `Text`: `errorTitle`, `errorMessage`, `empty.title` and `empty.description` are `string`. `empty.icon` crosses over, and also accepts the native `EmptyState`'s function, which delivers the color and the size. It is the same note the `ChartContainer` already carries.

**`classNames` ports with the web's names:** `loading`, `error` and `empty`. `className` still styles the three endings, as on the web, and each part styles only its own: the frame that reserves the height applies equally to all three, but the error that asks for a border cannot carry the border to the skeleton. With no descendant selector in React Native, the part is the only way to style one ending without styling the others.

The generic skeleton stays in the piece, and does not come from the caller: without it, `isLoading` without `skeleton` would collapse the screen to zero height and it would jump when the data arrived. On the phone this hurts more, because there is no scroll bar or network indicator to explain the wait.
