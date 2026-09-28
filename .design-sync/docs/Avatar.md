---
category: Structure
---

# Avatar

A person's photo, with the initial behind it.

The initial does not show up right away: Base UI waits a moment, so a photo
that loads quickly does not flash the letter first.

## In React Native

Translates: `@rivocode/ui-native` exports `Avatar` - remote `src` through the core's `Image`; `fallback` is required, because it is what shows while the photo downloads and if it fails. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
