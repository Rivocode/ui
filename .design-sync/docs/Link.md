---
category: Typography
---

# Link

The house anchor: underlined, with a visible focus ring, in the theme's text
tones.

```tsx
<Link href="/notas">Ver notas</Link>
```

The underline is on by default. In the middle of a sentence, color alone is
not enough to separate the link from the surrounding text, and someone who
cannot tell the color apart is left not knowing where to click.
`underline="hover"` only underlines on hover, and only applies outside running
text: in a list of links in the footer or the navigation, where the position
already says that it is a link.

`tone` picks the color: `accent` is the standalone link on the page, `neutral`
and `muted` serve lists of links, and `inherit` takes the sentence's color. Use
`inherit` inside an `Alert` or on any status background, where the tone's
color has already been measured against that background and the accent has
not.

## Off the site

`external` opens in another tab with `rel="noopener noreferrer"`, draws the
outbound arrow and says "(abre em nova aba)" to the screen reader, after the
link text. Sighted users see the arrow; listeners hear the sentence.
`labels.external` swaps the sentence, and the `rel` you pass is kept, added to
the two security values.

```tsx
<Link href="https://www.gov.br/nfse" external>
  Portal da NFS-e
</Link>
```

## With the router's link

`render` swaps the anchor for your router's link, and the look stays the one
from here. The `href`, navigation and prefetching become the router's.

```tsx
import { Link } from '@rivocode/ui'
import { NavLink } from 'react-router'

<Link render={<NavLink to="/clientes" />}>Ver todos os clientes</Link>
```

Almost every router also exports a `Link`, and the two names do not fit in the
same file. Rename one of them on import
(`import { Link as RouterLink } from 'react-router'`), or use `NavLink`, as
above.

## When not to use

- **An action that changes something:** `Button`. A link navigates, a button
  acts: saving, deleting, opening a dialog and submitting a form are actions,
  and a link that does that does not respond to the space bar, does not open
  in another tab and lies to whoever listens to the screen.
- **Navigation that needs to look like a button**, like the "Nova nota" at the
  top of the page: `Button` with `render={<a href="…" />}`. The tag is still a
  link, and the look is the button's.
- **A menu item that leads to another page:** `MenuLinkItem`, which moves with
  the arrows along with the other menu items.

## In React Native

Translates, as a `Text` with `accessibilityRole="link"`, and so it goes inside the sentence as on the web: `<Text>Veja o <Link href="…">espelho</Link>.</Text>` wraps along with the surrounding text. `tone` has the same four values, and the underline is fixed.

**`onPress` is what navigates, not a `render`.** There is no anchor in React Native to swap for the router's, so the web's composition becomes a callback: `onPress={() => router.push("/notas")}`. Without `onPress`, a tap opens the `href` through `Linking`, which is the path for `https:`, `mailto:` and `tel:`.

**`external` draws the arrow and warns through the hint**, the `accessibilityHint`, which the screen reader reads after the name; the text is `labels.external`, and the default is “Abre fora do app.”. When the child is plain text, the accessible name is that text, without the arrow. There is no `underline`: on touch there is no hovering, and the underline is always the running text's.
