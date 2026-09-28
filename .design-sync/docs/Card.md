---
category: Structure
---

# Card

A surface that groups related content.

Composes with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` and
`CardFooter`. The title renders as `<h3>`, so it respects the page hierarchy.

`elevation="flat"` (default) sits on the background. `raised` gets a shadow,
for what needs to stand out. Do not stack elevations: if everything stands out,
nothing does.

## In React Native

Translates: `@rivocode/ui-native` exports `Card` - with `CardHeader`, `CardTitle`, `CardDescription` and `CardContent` (no `CardFooter`). The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
