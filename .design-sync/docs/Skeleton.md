---
category: Feedback
---

# Skeleton

A placeholder while the data has not arrived.

Give it shape with utilities: `<Skeleton className="h-4 w-40" />`. Reproduce the
shape of the content that is coming, otherwise the screen jumps when it
arrives.

It is hidden from the screen reader on purpose. Mark the container with
`aria-busy="true"`, which is where the loading notice belongs. It respects
`prefers-reduced-motion`.

## In React Native

Translates: `@rivocode/ui-native` exports `Skeleton` - same placeholder, same token, and the same 2 s pulse; still with reduce motion. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
