---
category: Overlays
---

# Dialog

A modal window, for a decision that cannot carry on in the background.

Composes with `DialogTrigger`, `DialogContent`, `DialogTitle`,
`DialogDescription`, `DialogFooter` and `DialogClose`.

Renders in a portal inside the `RivoProvider` container, which carries the
theme. Without the Provider it throws, rather than rendering unstyled.

## When not to use

To confirm what cannot be undone (deleting, cancelling an invoice, leaving
without saving), use `AlertDialog`. This one closes with Esc and with a click
outside, and that is what sets it apart from the other: a window that can be
dismissed by accident is no good for a question whose wrong answer has no
undo.

For the panel that opens on a phone, prefer the `Sheet`: a centered modal on a
narrow screen covers almost everything and fights with the keyboard. And for
what only adds context next to a button (an explanation, a two-line form), the
`Popover` costs less: the modal locks the rest of the page, and locking the
page to show a piece of text is charging a lot for little.

## In React Native

Translates: `@rivocode/ui-native` exports `Dialog` - `open`, `onOpenChange` and `title` as props; no `DialogTrigger`. It opens with a fade, and with no transition when the system asks to reduce motion; the card rises into the space above the keyboard. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
