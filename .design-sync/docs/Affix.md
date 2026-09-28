---
category: Structure
---

# Affix

An element that sticks to the window and stays still while the page scrolls
underneath: the main action of a long form, the draft-saved notice, the help
button in the corner. The component draws nothing, it only positions.

```tsx
<Affix position={{ bottom: 24, right: 24 }}>
  <Button>Assinar contrato</Button>
</Affix>
```

## Position

`position` gives the distance from each side of the window. A number is
pixels, and a string is any CSS measurement, tokens included:
`{ bottom: 'var(--rc-pad-panel)' }`. A side without a value stays loose.
Without `position`, the component sticks to the bottom right, one panel
spacing away from the edges.

## On top of what

Stacking comes from `--rc-z-*`, never from a number. `layer` picks the layer:
`sticky` (the default) sits with the fixed header and below menu, sheet,
dialog, toast and tooltip, which is where something that sticks to the page
wants to live. `dropdown` and `overlay` rise to the menus' layer and the dialog
backdrop's layer, for the rare case where the component needs to sit above an
open menu.

The component renders in the `RivoProvider` portal container, outside the
tree. That frees it from an ancestor with `transform`, `filter` or `overflow`,
which would trap `position: fixed` inside it, and the container carries the
theme, so what goes inside stays dressed. `withinPortal={false}` leaves it
where it was written.

## Focus does not stop behind it

A fixed element can cover what the keyboard focused: the person presses Tab,
focus goes down to the last field on the screen, and the field is under the
stuck button. That is what WCAG criterion 2.4.11 forbids.

The remedy is the page's `scroll-padding`, and the component writes it on its
own: having measured its height and its distance from the edge, it reserves
that space in the `html` element's `scroll-padding-bottom` (or in
`scroll-padding-top`, when it sticks to the top), plus an 8-pixel margin. With
that the browser, when scrolling to the focus, stops before the covered strip.
Several components on the same side count by the largest, and the value the
page already had comes back when the last one unmounts.

`reserveSpace={false}` turns the reservation off, when the page already takes
care of it in its own CSS:

```css
html {
  scroll-padding-bottom: 5rem;
}
```

The reservation applies to focus that arrives by scrolling. A form with the
action stuck to the bottom still needs spacing at the end of the content,
otherwise the last field stays under the button forever: a `pb-20` on the
container solves it.

## In a scrolling box

`strategy="absolute"` swaps the window for the nearest positioned ancestor.
Put `relative` on a wrapper around the scrolling box, not on the box itself,
otherwise the component scrolls along with the content:

```tsx
<div className="relative">
  <div className="h-96 overflow-y-auto">…</div>
  <Affix strategy="absolute" position={{ bottom: 16, right: 16 }}>
    <Button>Assinar contrato</Button>
  </Affix>
</div>
```

In this mode there is no portal and no reservation: the page's
`scroll-padding` does not reach the box.

## When not to use

- **A top that sticks while the section scrolls** is `position: sticky`, or
  the `AppShell` header. `Affix` leaves the flow and reserves no room on the
  page; `sticky` occupies its place and only sticks inside its parent.
- **Actions on selected items** are `ActionBar`, which appears with the
  selection and announces how many were chosen.
- **Back to the top** is `ScrollToTop`, which is already an `Affix` with the
  button, the scroll threshold and focus solved.
- **A notice that passes** is `Toast`, and one that stays at the top of the
  page is `Banner`. `Affix` announces nothing to the screen reader.

## In React Native

Does not port, by decision: in React Native, sticking is the out-of-the-box behavior. There is no window that scrolls; what scrolls is the `ScrollView` or the `FlatList`, and a `View` with `position: absolute` written next to it, not inside it, stays still on screen while the list runs underneath. There is no portal to open and no ancestor `transform` to escape.

For the title that sticks while the list scrolls, the list already has `stickyHeaderIndices` and `stickySectionHeadersEnabled`. And the action that follows the whole screen at the bottom is `ActionBar`, which translates and already accounts for the safe area through `bottomInset`.
