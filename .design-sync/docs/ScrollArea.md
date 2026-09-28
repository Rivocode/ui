---
category: Structure
---

# ScrollArea

A scroll area with its own scrollbar.

It is for when the system scrollbar gets in the way of the design: on Windows
it takes up width and pushes the content, and the difference between platforms
shows on screen. **For ordinary page scrolling, `overflow-y-auto` is still
cheaper.**

```tsx
<ScrollArea className="h-48">
  {notas.map((nota) => (
    <p key={nota.id}>{nota.descricao}</p>
  ))}
</ScrollArea>
```

`horizontal` turns on the sideways bar too, for a wide table and a row of
cards.

## In React Native

Translates, and changes subject on the way. On the web the piece exists because of the **scroll bar**: the system's takes up width on Windows and draws differently on each platform. On the phone the scroll bar is the system's and stays that way, and the scrolling problem that hurts is another: **the keyboard covers the field**. A form at the end of the screen disappears under it, and the submit button stays hidden until someone closes the keyboard to find it.

So the native `ScrollArea` is the form screen. Underneath it is the `KeyboardAwareScrollView` from `react-native-keyboard-controller`: on focusing a field, the scroll moves until it stops `bottomOffset` points above the keyboard (16 by default), in the same frame the keyboard rises, on both systems. A tap on a list item does not close the keyboard (`keyboardShouldPersistTaps="handled"`).

```tsx
<ScrollArea
  contentContainerClassName="gap-4 p-5"
  footer={<Button onPress={emitir}>Emitir nota</Button>}
>
  <Field label="Descrição">…</Field>
</ScrollArea>
```

`footer` is the action pinned below the scroll, and it **rises with the keyboard**: the submit button is always in view. Its height goes into the math of where the focused field stops, so no field stays hidden behind the button. With "reduce motion" on, the footer jumps straight above the keyboard instead of following it; the scroll to the field still happens, because without it the field stays covered.

There is no `horizontal`: a row of cards that scrolls sideways is a plain `ScrollView`, and has no field for the keyboard to cover. `react-native-keyboard-controller` is a peer of the package, and the `KeyboardProvider` it asks for already comes inside `RivoProvider`.

The scrolling content is styled through `contentContainerClassName`, the name `ScrollView` already gives it, and the `footer` strip through `classNames.footer`.
