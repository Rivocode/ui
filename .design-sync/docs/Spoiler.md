---
category: Structure
---

# Spoiler

Shows the beginning of a long text and hides the rest behind a "Ler mais". A
product description, the terms of use, a client's internal note, the long reply
to a ticket.

```tsx
<Spoiler maxHeight={96}>
  <p>O plano Empresa emite nota fiscal de serviço em mais de 1.200 prefeituras…</p>
  <p>Boletos e cobranças por Pix saem da mesma tela…</p>
</Spoiler>
```

## By height, and only when it overflows

The cut is by **height**, in pixels (`maxHeight`, 120 without the prop), and not
by number of characters: what fits depends on the screen width, and the piece
measures the real content, again each time it changes size.

Content that fits in the height gets no button, no cut and no gradient. That is
why the same `Spoiler` can be used on every row of a list, with short and long
text mixed.

## The cut

Collapsed, the last two visible lines fade into a gradient. It is a mask, not a
layer painted on top: it works over `bg`, `surface`, a card or an image,
without knowing the background color. The gradient measures two line heights
(`2lh`), so it follows the body text, and the line the cut catches halfway
never shows with a hard edge.

On opening, the box grows to its full height with the `base` duration and the
house curve, and with no motion when the system asks to reduce it.

## The button

"Ler mais" collapsed, "Ler menos" open, and `aria-expanded` tells the state to
whoever is listening. `aria-controls` points to the box. `labels` changes both
texts:

```tsx
<Spoiler labels={{ more: 'Ver o termo inteiro', less: 'Recolher o termo' }}>
  <p>Ao aceitar, você autoriza a emissão de documentos fiscais…</p>
</Spoiler>
```

Controlled, `open` and `onOpenChange` go together; uncontrolled,
`defaultOpen` decides how it starts. They are the same names as in
`Collapsible` and `AccordionItem`: opening and closing is called `open`
throughout the library.

## What is hidden does not disappear

The cut is only visual. The screen reader reads the whole text, collapsed or
not, and a link below the cut stays in the Tab order. When focus enters an
element below the cut or inside the gradient, `Spoiler` opens on its own,
scrolls the text back to the beginning and brings the focused element into view,
so nobody focuses on what they cannot see.

## Parts

`classNames` reaches each node by name: `content` (the box that cuts) and
`trigger` (the button). `className` goes on the root, and that is where the
text's body size and tone come in.

## When not to use

- **One line or a few, cut with an ellipsis, with no opening** is `Text` with
  `truncate` or `lineClamp`. `Spoiler` is for whoever will want to read the
  rest right there.
- **A whole block that starts closed, with its own title** ("Ver os detalhes
  do cálculo") is `Collapsible`. `Spoiler` shows the beginning of the content;
  `Collapsible` hides everything behind the title.
- **Several sections that close each other** is `Accordion`.
- **Text that does not fit and that the person needs to read in full to
  decide**, such as a contract before accepting, goes open in a `ScrollArea` or
  a `Dialog`. "Ler mais" invites skipping.

## In React Native

Translates, with the same `maxHeight`, `open`, `defaultOpen`, `onOpenChange` and `labels`, and the same button that only appears when the content overflows. The button states its state through `accessibilityState.expanded`.

**Collapsed, the screen reader hears that the text is cut.** `overflow` hides only from sight, and TalkBack and VoiceOver read the whole block. So the collapsed content becomes a single element for the reader, with the hint "Texto cortado. Toque em Ler mais para ver o resto."; when open, the hint goes away. A link inside the collapsed block does not receive its own focus until it opens.

**The fade is painted, not a mask.** React Native has no mask without a new dependency, so the last 40 points get bands in the background color, with increasing opacity. The color comes from `fadeOver` (`bg`, `surface` or `surface-raised`, `bg` without the prop): set the background the block sits on, otherwise the fade shows up as a band.

`className` goes on the root, and the parts are styled through the same `classNames` as the web: `content` (the box that clips) and `trigger` (the button).
