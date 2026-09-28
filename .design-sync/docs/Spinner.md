---
category: Feedback
---

# Spinner

A waiting spin with no foreseeable end.

When it can be measured, `Progress` says more. When the wait is going to fill a
whole screen, `Skeleton` shows the shape of what is coming, which is less
alarming.

It stops spinning when the system asks for less motion, and stays in place:
removing the notice would leave the screen looking frozen.

## In React Native

Translates: `@rivocode/ui-native` exports `Spinner` - `sm`, `md` and `lg` and the same `label`; `sm` and `md` are the small spin of the `ActivityIndicator`. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
