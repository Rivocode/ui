---
category: Forms
---

# SearchInput

The search field with the magnifying glass in place: the arrangement every
listing used to build by hand with `position: absolute`.

It comes out as `<input type="search">`, so the screen reader announces
"search" and Esc clears it. Without `onClear`, Esc goes down the same path as
typing: `onChange` and `onValueChange` receive the empty text, and the
controlled field clears when the user's state accepts it. With `onClear`,
clearing is up to it.

`onValueChange` delivers the text on every keystroke, as in `Input` and in the
React Native `SearchInput`. With it, the controlled field is `value` plus
`onValueChange`, without pulling the text out of the event. The DOM `onChange`
is still called alongside.

```tsx
const [filter, setFilter] = useState("");

<SearchInput aria-label="Buscar nota" value={filter} onValueChange={setFilter} />
```

`shortcut` shows the shortcut in a `Kbd` inside the field (`"mod+k"` comes out
as ⌘K on the Mac and Ctrl K elsewhere). Only the drawing: registering the
shortcut is the job of whoever builds the screen, because it is the screen that
knows what else listens to the keyboard.

It pairs with `DataTable`'s `filter`: the field sits wherever the screen asks
and the table only receives the text.

## In React Native

Translates: `@rivocode/ui-native` exports `SearchInput` - `value` and `onValueChange` required. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
