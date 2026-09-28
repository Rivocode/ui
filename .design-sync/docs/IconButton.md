---
category: Actions
---

# IconButton

A button that only has an icon. It is the recommended path for the table-row
action, closing a panel, downloading, editing: everything that fits in a
square.

```tsx
<IconButton variant="ghost" label="Excluir nota">
  <Trash2 />
</IconButton>
```

**`label` is required, and the type does not let you forget it.** It becomes
the button's accessible name, and it is the only door to that: `aria-label`
and `aria-labelledby` are removed from the type, so the name does not have two
paths that diverge. Say the action, not the drawing: "Excluir nota", not
"Lixeira". A button without a name is announced as "button", and nothing more.

The icon renders `aria-hidden`, because the `label` is what names it, and its
size comes from the piece: 16px at `sm` and `md`, 20px at `lg`. There is no
need to pass `size` to the lucide icon.

## Variants and sizes

The same five variants as `Button` (`primary`, `secondary`, `outline`,
`ghost`, `danger`) and the same `shape="pill"`, read from the same classes:
`IconButton` is a `Button` inside, not a copy of it. What changes is the size.
`sm`, `md` and `lg` are squares whose side is the token's control height
(`--rc-control-sm`, `-md`, `-lg`), so the icon button shrinks along with the
field next to it in compact mode and is never taller than it.

## With a tooltip

`tooltip` shows the `label` in a tooltip on pointer hover or keyboard focus.
Turn it on when the icon is not universal. A pencil reads on its own, and a
generic sheet of paper does not say whether it opens the PDF or the XML.

```tsx
<IconButton variant="ghost" label="Ver o XML da nota" tooltip>
  <FileText />
</IconButton>
```

The tooltip **does not go into the name**: it repeats the `label`, and tying
it through `aria-describedby` would make the screen reader say the same
sentence twice. It is for sighted users who do not know the icon yet.
`tooltipSide` picks the side.

## Loading and disabled

`loading` swaps the icon for the spinner in the same square, blocks the click
and announces `aria-busy`, and the name stays the same: the person listening
knows what they are waiting for. `disabled` is the one from `Button`, with the
disabled background, color and outline.

## As a link

`render={<a href="..." />}` swaps the element, as in `Button`, and the `label`
keeps naming the link.

## When not to use

If there is room for the word, use `Button` with text: a written label is
clearer than any icon with a tooltip, and it is the only one of the two that
works on touch. A screen's main action is almost never just an icon.

A button that stays pressed (bold, alignment, display mode) is `Toggle`:
`IconButton` fires an action and holds no state, and `Toggle` says
`aria-pressed`.

`Button` does not draw an icon square: its `size` is only `sm`, `md`, `lg` and
`xl`, all with a written label. An icon-only button is always this piece,
because it requires the name, has the three sizes and handles waiting without
widening the square.

## In React Native

Translates, with the name required the same way and under the same name: `label`, and the type rejects the button without it. `accessibilityLabel` does not come in: there is only one name, `label`, and it is what becomes the `Pressable`'s `accessibilityLabel`.

**The touch target is never below 44pt.** `md` is the 44 square and `lg` the 48; `sm` draws 32 and gets a `hitSlop` of 6 on all four sides, which gives back the 44 without growing the drawing. The variants are those of the native `Button` (`primary`, `secondary`, `ghost`, `outline`, `danger`), read from the same classes: only `shape` does not cross over, for the same reason as there.

**There is no `tooltip`.** The tooltip appears on resting the pointer, and on touch there is no resting. If the icon does not read on its own, the button needs text: use `Button`.

The icon comes in as a child, and the form that paints in the variant's color is the function, because color does not flow down from the `View` to the SVG:

```tsx
<IconButton label="Excluir nota" variant="ghost" onPress={excluir}>
  {({ color, size }) => <Trash2 color={color} size={size} />}
</IconButton>
```
