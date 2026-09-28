---
category: Structure
---

# PageHeader

The top that every route rewrites a little differently: breadcrumb, title,
description and the screen's actions, in the same hierarchy on every page.

The title renders in an `<h1>` by default. A page header is the top of the
page, and starting the page with an `h2` leaves a gap that the screen reader
feels. The breadcrumb comes through the `breadcrumb` slot, with the house
`Breadcrumb`; the actions come through `actions` and sit on the right,
wrapping to a new line on narrow screens before squeezing the title.

## When the header is not the top

`titleAs` lowers the title to `h2` or `h3` without touching the design.
Semantic level and visual size are different things, and the title stays the
same `text-2xl` at any level.

```tsx
<PageHeader titleAs="h2" title="Notas fiscais" />
```

Use it when the `PageHeader` is not the start of the page: the application
already has the `h1` in the shell, the piece is inside a region, or it is an
example inside another page (like the ones on this page, which render as `h2`
precisely for that reason). Two `h1` on the same page raise no error anywhere:
it is whoever navigates by level-1 heading who lands in the wrong place.

## In React Native

Translates: `@rivocode/ui-native` exports `PageHeader` - `title`, `description`, `badge` and `actions` as props; `classNames` with the web's five parts. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
