---
category: Forms
---

# TagsInput

A list of tags the person writes: an invoice's labels, a filter's words, the
emails of an invitation.

Three gestures the piece solves once, so they are not solved five different
ways: Enter closes the chip, Backspace with the field empty removes the last one
(it is the gesture everyone tries first) and a repeated one does not go in
twice, because tagging the same thing twice is never what was meant. Leaving
the field also closes what was being written: text typed and not closed
disappears on submitting the form, and nobody understands why.

Pasting a list separated by the `separators`, or by line breaks, becomes one
chip per item. With `max`, the field stops accepting new chips at the ceiling,
but stays focused: Backspace still removes the last one. With `name`, the native
form receives each chip under that name, and never the half-written text.

It keeps its own list when it receives only `defaultValue`, and obeys the
outside one when it receives `value`, the same pair as the other form pieces.
In a form that submits, control it: the app holds the list, because it is the
one that sends it. In a screen filter, which submits nothing, `defaultValue`
saves the `useState`.

```tsx
<TagsInput defaultValue={['nf-e']} aria-label="Palavras do filtro" />
```

## The label

Wrap it in a `Field` with `FieldLabel`, like any house field. The writing field
goes through `Field.Control`: it is the one, not the chips' frame, that
receives the label's `id`, the `aria-describedby` of the help and the error,
and `aria-invalid`. Clicking the label focuses the field, and the frame turns
red when the `Field` is invalid.

```tsx
<Field>
  <FieldLabel>Marcadores</FieldLabel>
  <TagsInput value={tags} onValueChange={setTags} placeholder="Escreva e tecle Enter" />
  <FieldDescription>Enter fecha a ficha.</FieldDescription>
</Field>
```

`placeholder` is not a label: it disappears the moment the person types, and
several screen readers do not announce it. Outside a `Field`, give it
`aria-label`.

The focus ring belongs to the writing field, not the frame. Each chip's x has
its own ring, and the two never light up together.

Removing a chip through its x does not throw focus to the start of the page: it
goes to the next chip's x, or the previous one's when it was the last, and to
the writing field when none is left.

## The x's name

Each chip says what is being removed: `labels.remove` receives its text and
returns the name the screen reader hears. Without it, a row of chips announces
itself "Remover, Remover, Remover", and whoever depends on the reader does not
know which button is which.

```tsx
<TagsInput
  defaultValue={['nf-e']}
  aria-label="Marcadores"
  labels={{ remove: (tag) => `Tirar o marcador ${tag}` }}
/>
```

## Motion

Only a chip added later grows as it enters (`animate-pop`, `--rc-duration-fast`). The ones already in the value are born still: they are the form, not something that just happened.

## When not to use

When the options already exist, use `Combobox` with `multiple` and the chips: it
shows the catalog before letting you choose. `TagsInput` is for when the list
is born from what is typed and there is nothing to suggest.

## In React Native

Translates, with one gesture fewer. Enter closes the chip and so does the typed separator, but it is read from the text, not from the key, because Android's `onKeyPress` does not arrive for the system keyboard. It is that same event that was missing for Backspace on an empty field to remove the last chip, and so it does not port: on the phone a chip is removed by its x, which already needed to exist for the finger. The rest is the same: the piece is controlled, a repeated one does not go in twice and leaving the field closes whatever was half written. The x's name comes through `labels.remove`, as on the web.

The parts are styled through the same `classNames` as the web: `field`, `tag`, `remove` and `input`.
