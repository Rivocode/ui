---
category: AI
---

# PromptInput

The field where the person writes to an assistant: it grows with the text,
sends on Enter, breaks the line on Shift+Enter and swaps the send button for
the stop button while the answer arrives. Lives in `@rivocode/ui/ai`.

```tsx
import { PromptInput } from '@rivocode/ui/ai'

<PromptInput
  streaming={isStreaming}
  onSubmit={(text) => send(text)}
  onStop={() => stop()}
/>
```

The piece knows no model, no SDK and no network. It delivers the text in
`onSubmit` and receives `streaming` back; what talks to the model is your
screen, with the SDK it already uses.

## Sending, breaking the line and stopping

- **Enter sends.** With the field empty (whitespace only counts as empty),
  disabled or in `streaming`, it sends nothing.
- **Shift+Enter breaks the line.** The hint is wired to the field through
  `aria-describedby`, so a screen reader user hears both rules on entering it.
- **Enter in the middle of a keyboard composition does not send.** Whoever
  types with a dead-key accent or with an ideogram keyboard confirms the
  character with Enter, and sending half the message there is the most common
  defect of this kind of field.
- **In `streaming`, the button becomes the stop button**, named "Parar
  resposta", and calls `onStop`. The field keeps accepting text for the next
  question: only sending waits.
- **Focus is not lost when the button disables.** Whoever presses Enter on
  "Parar resposta", or is on it when the answer finishes, sees the button go
  back to being the send button, disabled because the field is empty. Focus
  goes back to the field, and does not fall to the top of the page on every
  turn. The same goes for whoever sends through the button.

The field grows up to `maxRows` lines (8, without the prop) and, from there
on, scrolls inside. The height is also recomputed when the width changes and
when the house font finishes loading: two-line text is not cut off on a phone,
nor after the window shrinks.

## Controlled or not

Without `value`, the piece holds the text and clears it after sending. With
`value` and `onValueChange`, you are the one who clears it, in `onSubmit`: that
is what lets you put the text back in the field when sending fails.

```tsx
const [text, setText] = useState('')

<PromptInput
  value={text}
  onValueChange={setText}
  onSubmit={async (value) => {
    setText('')
    const ok = await send(value)
    if (!ok) setText(value)
  }}
/>
```

## Attachments, actions and counter

`attachments` is the place above the field for what has already been
attached: chips, thumbnails. `actions` is the left corner of the footer, to
attach, pick the model or dictate. The piece **does not pick files**: it only
reserves the place, and the picker is yours.

`showCount` shows the character count, like `120/4000` when there is
`maxLength`. On hitting the ceiling the count goes to the danger tone, and the
field refuses what goes beyond it. The counter is wired to the field through
`aria-describedby`, spelled out ("120 de 4000 caracteres"), and the ceiling is
announced in a live region ("Limite de 4000 caracteres atingido."): whoever
cannot see the color finds out why the key stopped writing.

```tsx
<PromptInput
  maxLength={4000}
  showCount
  attachments={<Badge>nota-agosto.pdf</Badge>}
  actions={
    <IconButton label="Anexar arquivo" variant="ghost" size="sm">
      <Paperclip />
    </IconButton>
  }
/>
```

## Names

The field is called "Mensagem", the button "Enviar mensagem" and the stop one
"Parar resposta". `label`, `labels.submit` and `labels.stop` swap all three,
for another language or for an assistant with a name of its own.

`labels` swaps what the screen reader hears beyond the names: `hint` (the
keyboard hint), `count` (a function of the count and the ceiling) and `limit`
(the ceiling notice).

```tsx
<PromptInput
  label="Message"
  labels={{
    hint: 'Enter sends, Shift+Enter adds a line.',
    count: (count, max) => `${count} of ${max} characters`,
    limit: (max) => `${max} character limit reached.`,
  }}
/>
```

## Parts

`classNames` reaches `attachments`, `textarea`, `footer`, `count` and `submit`
(the send button and the stop button, which take the same place).

## When not to use

- **Long form text** is `Textarea`. `Textarea` holds a note, a service
  description, and is submitted together with the rest of the form;
  `PromptInput` is a conversation, and each Enter is a send. A notes field that
  sends on Enter loses the person's text at the first line break.
- **Search** is `SearchInput`. A question to an assistant and a list filter
  look like the same box, but search answers while you type and has no stop
  button.

## In React Native

Translates, on its own path `@rivocode/ui-native/ai`, with the same `streaming`, `onStop`, `attachments`, `actions`, `maxLength`, `showCount`, `labels` and the same accessible names ("Mensagem", "Enviar mensagem", "Parar resposta").

**The counter arrives through the field.** The hint (`labels.hint`) and the spelled-out count (`labels.count`) go in the field's `accessibilityHint`, and the visible number stays out of the accessibility tree. On hitting `maxLength`, the screen reader announces `labels.limit`, once per arrival at the ceiling. The default hint talks about the return key, which here breaks the line.

**It is controlled.** `value` and `onValueChange` are required, like every field in the package, and clearing the field after `onSubmit` is the caller's job.

**Submitting is only through the button.** On the phone keyboard, the return key of a multi-line field breaks the line, and that is what the person expects of it; there is no Shift to separate the two gestures. The field grows up to `maxRows` lines (8, without the prop, as on the web) and scrolls internally.

The parts are styled through the same `classNames` as the web: `attachments`, `textarea`, `footer`, `count` and `submit`, which also styles the stop button in its place.
