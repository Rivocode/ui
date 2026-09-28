---
category: Overlays
---

# Sheet

A sheet that slides in from the edge of the screen, with a drag gesture.

It composes with `SheetTrigger`, `SheetContent`, `SheetTitle`,
`SheetDescription`, `SheetHandle` and `SheetClose`.

`side` decides where it enters from, and the close gesture follows the side. It
is the navigation piece on the phone and the action panel where the thumb
reaches. The type is `SheetSide`, and there are three sides: `bottom` (the
default), `left` and `right`. There is no `top`, because a sheet that comes
down from above competes with the phone's status bar and with every fixed
header.

The backdrop lightens along with the finger: pulling halfway shows half of what
is behind.

## In React Native

Translates: `@rivocode/ui-native` exports `Sheet` - only the bottom behavior, which was already the web's narrow mode; it slides up, and with no transition when the system asks to reduce motion; with a field inside, the sheet rises along with the keyboard. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
