---
category: Actions
---

# Button

An action. Renders as a native `<button>`, and becomes an `<a>` with `render={<a href="..." />}`.

**When to use each variant.** `primary` for the main action of the screen, only
one per area. `secondary` for the alternative. `outline` for a secondary call
to action on a marketing page. `ghost` for a discreet action in a table or
header. `danger` for what deletes, and only for that.

**Size.** `sm`, `md` and `lg` read their height from the density token, so they
shrink on their own in compact mode. `xl` is for marketing: bigger, with its
own measurement, and it does not shrink in compact mode. It is only a size,
like the other three: the weight stays the house medium. For the bold of a
call to action, add `className="font-rc-bold"`.

**An icon-only button is `IconButton`.** It requires `label`, which becomes
the accessible name, has the three square sizes read from the control token,
swaps the icon for the spinner in `loading` without widening, and shows the
`label` as a tooltip with `tooltip`. `Button` has no icon size: the square only
exists in `IconButton`, and that is the one that demands the name.

**Shape.** The product default is the 8px corner. `shape="pill"` is a marketing
signature, not a form one.

`loading` disables and announces busy.

**Disabled.** `disabled` paints the background with `surface-raised`, the label
with `fg-disabled` and the outline with `border-disabled`, in every variant
that has an outline or a fill: `primary`, `secondary`, `outline` and `danger`.
Without the outline, a disabled button on a white surface became a loose
label, because in the light theme `surface-raised` and `surface` are the same
white. The inactive outline is weaker than the live one (`check:contrast`
requires the live one to weigh 1.4 times more), so it does not look clickable.
`primary` and `danger` are born with a transparent 1px border, so the size
does not jump when disabled. `ghost` stays without an outline: live, it never
had one.

**Disabled link.** With `render={<a href="..." />}` and `disabled` or
`loading`, the link loses its `href`, gets `aria-disabled="true"`, stops
receiving the pointer and does not call `onClick`: `<a>` has no native
`disabled`, and without this it would keep navigating.

## In React Native

Translates: `@rivocode/ui-native` exports `Button` - controlled contract; `hitSlop` on `sm`, because a 32px target cannot be tapped without help. It sinks slightly on press, and does not sink when the system asks to reduce motion. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
