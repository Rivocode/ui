---
category: Actions
---

# ScrollToTop

The floating "Voltar ao topo" button. It only exists after the person scrolls
past a threshold, sits in the corner of the window, and takes them back to the
start of a long page: a listing with many rows, a report, a terms page.

```tsx
<ScrollToTop />
```

It is the house `IconButton`, pill-shaped and with a shadow, with the up arrow
and the name "Voltar ao topo", pinned to the bottom right corner by an `Affix`.

## When it shows

`threshold` is how many pixels the person needs to scroll down: 400 by default.
Above that the button **does not exist**, and does not just stay invisible: it
is not in the Tab order nor in the screen reader's list of buttons. It enters
with the short appear animation, which turns itself off when the system asks to
reduce motion.

## What the click does

It scrolls to the top, smoothly, or **in a jump** when the system asks to
reduce motion. And it **moves focus to the start of the page**: the `<main>`,
or the `<body>` when there is no `<main>`. Without that, focus would stay on the
button, which disappears as soon as the page reaches the top, and keyboard
users would end up back at the end of the page on the next Tab. The target gets
`tabindex="-1"` only while it has focus.

`focusTarget` chooses another target, such as the screen's `<h1>`.
`onScrollToTop` is called after the climb has started.

## In a scrolling box

`target` swaps the window for a box with its own scrolling: that is where the
distance is measured, that is what scrolls up, and that is where focus goes.
With `strategy="absolute"`, the button sticks to the corner of the positioned
ancestor instead of the corner of the window.

```tsx
const [caixa, setCaixa] = useState<HTMLDivElement | null>(null)

<div className="relative">
  <div ref={setCaixa} className="h-96 overflow-y-auto">…</div>
  <ScrollToTop target={caixa} strategy="absolute" position={{ bottom: 16, right: 16 }} />
</div>
```

Pass the element, kept in state, and not the `ref`: the button needs to know
when the box arrived to start measuring.

## Position and appearance

`position`, `strategy`, `layer`, `withinPortal` and `reserveSpace` are
`Affix`'s and pass straight through to it. `label` changes the name, `icon`
changes the arrow, `tooltip` shows the name in a tooltip, and `size` and
`variant` are `IconButton`'s. `className` dresses the layer that sticks and
`classNames.button`, the button.

The button reserves its own height in the page's `scroll-padding-bottom`, so
keyboard focus does not stop hidden behind it. The explanation is in `Affix`.

## When not to use

- **A short page**, one that fits in two screens, does not need it: the person
  scrolls back, and the button only takes up the corner.
- **Jumping to a section** is `TableOfContents`. The button only knows the top;
  the table of contents knows the whole way.
- **Another action that follows the scroll** (sign, save, issue) is `Affix`
  with the `Button` inside. `ScrollToTop` is only the climb.
- **Actions on selected rows** are `ActionBar`, which appears through
  selection, not through scrolling.

## In React Native

Does not port, by decision: the phone already scrolls the list up out of the box. On iOS, tapping the status bar takes the screen's `ScrollView` and `FlatList` to the top (that is `scrollsToTop`, on by default), and in Expo Router and React Navigation tapping again on the tab the person is already on does the same, with `useScrollToTop(ref)` on the list. A floating button on top of that would be a third path to the same gesture, covering the corner where the screen's main action lives.

There is no focus to give back: touch navigation has no Tab that continues from the end of the page.
