---
category: Overlays
---

# AlertDialog

The confirmation of something that cannot be undone: deleting, cancelling an
invoice, leaving without saving.

Composes with `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`,
`AlertDialogDescription`, `AlertDialogFooter` and `AlertDialogClose`.

It does not close with Esc or with a click outside, and focus starts on the
cancel button. Whoever is about to delete something has to say yes on purpose,
not bump into a click.

On a phone the buttons stack and take the full width.

## When not to use

For any other modal window (a form, a detail, a choice that can be undone), use
`Dialog`. What this one charges extra is the way out: with no Esc and no click
outside, whoever opened it by mistake has to read the buttons to escape.
Charging that on every window trains people to click confirm without reading,
which is exactly the habit this component exists to prevent.

## In React Native

Translates: `@rivocode/ui-native` exports `AlertDialog` - `onConfirm`, `onCancel` and `labels` instead of composition, with the names of the `Popconfirm`; `tone` `danger` or `neutral`, and an `onConfirm` that returns a promise holds the modal in a waiting state until it settles; it does not close on a tap outside, as on the web. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
