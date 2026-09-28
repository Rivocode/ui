---
category: Feedback
---

# Kbd

The key of a shortcut, drawn as a key.

```tsx
<Kbd keys="mod+k" />
<Kbd>Esc</Kbd>
```

`mod` is the reason the piece exists. It comes out as `⌘` on Mac and `Ctrl`
everywhere else, reading the platform once. The alternative is each screen
deciding on its own, and half of them write Ctrl for everyone: a Mac user sees
the wrong symbol and concludes the shortcut does not exist.

It also knows `shift`, `alt`, `enter`, `esc`, `tab` and the arrows, and returns
the short symbol where the platform uses a symbol.

## Accessibility

A shortcut becomes one key per part, with the keys hidden from the screen
reader and the whole combination in the group's label. Without that the reader
spells out "command" and "K" as two loose texts, and the listener does not put
the combination together.

## When not to use

For a file name, a terminal command or a code snippet, use `code`. A key
shadow promises "press this", and promising wrong costs more than promising
nothing.

## In React Native

Does not port. The piece draws a key, and the phone has no physical keyboard for the key to represent: `⌘K` on a touch screen promises a gesture that does not exist. What on the web is a shortcut, on the phone is a visible button.
