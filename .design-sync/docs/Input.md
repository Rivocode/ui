---
category: Forms
---

# Input

Text control. Lives inside `Field`.

`size`: `sm`, `md` (default) and `lg`, all reading the height from the density
token. The native HTML `size` attribute does not exist here on purpose,
because it would collide with the variant.

## In React Native

Translates: `@rivocode/ui-native` exports `Input` - the border lights up on focus: there is no `focus-visible` on a touch screen; `onValueChange` receives the text, as on the web, and the `TextInput`'s `onChangeText` still works. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
