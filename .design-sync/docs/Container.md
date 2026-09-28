---
category: Structure
---

# Container

Centers the page content at a maximum width, with spacing on both sides.

```tsx
<Container render={<main />} size="md">
  <PageHeader title="Novo cliente" />
  <form>…</form>
</Container>
```

There are five steps, and each is a width the site and the example screens
already use:

| `size` | Max width | For what                                              |
| ------ | --------- | ----------------------------------------------------- |
| `sm`   | 36rem     | short form, sign-in screen                            |
| `md`   | 48rem     | registration, settings, running text                  |
| `lg`   | 72rem     | page with columns; it is the default                  |
| `xl`   | 80rem     | wide panel, listing with a filter at the side         |
| `full` | no ceiling | only the side spacing, for the screen that uses the full width |

The side spacing comes from the panel tokens: `--rc-pad-panel-sm` on a phone
and `--rc-pad-panel` from 640px up. Both shrink in the compact density, so the
operations screen gains the same usable width it gains in the controls.

`render` swaps the element without changing the width. The page's main region
is usually a `Container`, and writing it as `<main>` gives screen reader users
the shortcut to skip straight to the content.

## When not to use

- **When a `div` with a class is enough.** A width that shows up on a single
  screen, and that is none of the five steps, is `mx-auto max-w-[40rem]`. The
  component exists so the product's screens agree with each other, not to
  cover every possible width.
- **Inside a block.** `Container` measures the page. Inside a `Card`, a sheet
  or a `Splitter` column, the spacing already comes from the frame, and a
  second side spacing pushes the content inward twice.
- **The top of the screen.** Title, trail and actions are `PageHeader`, which
  goes inside the `Container`, not in its place.
- **Arranging the children.** `Container` only limits the width. The gap
  between blocks is `Stack`, and the columns are `Grid`.

## In React Native

Does not port, and it is not queued. `Container` limits the width of a page that can be 1920px, and its smallest step, `sm`, is 36rem: wider than any phone held upright. On touch it would be just side breathing room, and the breathing room of a native screen does not belong to a piece, it belongs to the screen: a `View` with `px-4` inside the safe area, or the `ScrollArea`'s `contentContainerClassName`. To arrange what goes inside, `Stack` and `Grid` port.
