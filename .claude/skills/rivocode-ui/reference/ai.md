# AI interface: `@rivocode/ui/ai`

It does not come in the main package. It has no dependency to install: it is a
separate path because of **weight**, since only the screen that talks to a model
needs these five pieces.

**None of them knows an AI SDK.** The message comes in by prop, and what the
person does comes out by event: `onSubmit`, `onStop`, `onRetry`, `onApprove`,
`onReject`, `onSuggestion`. Whoever talks to the model is your screen, with the
SDK it already uses. Do not install or import an SDK because of these pieces.

```tsx
import { Conversation, Message, PromptInput, ToolCall, AILabel } from '@rivocode/ui/ai'
```

## The conversation screen

```tsx
<div className="flex h-[32rem] flex-col gap-3">
  <Conversation
    className="flex-1"
    empty={{
      title: 'Pergunte sobre as suas notas',
      description: 'O assistente lê as notas emitidas nesta conta, e nada além delas.',
      suggestions: ['Quanto faturei em agosto?', 'Quais notas vencem esta semana?'],
    }}
    onSuggestion={send}
  >
    {messages.map((message) => (
      <Message
        key={message.id}
        role={message.role}
        streaming={message.streaming}
        copyValue={message.text}
        onRetry={message.role === 'assistant' ? () => retry(message.id) : undefined}
      >
        {message.text}
      </Message>
    ))}
  </Conversation>
  <PromptInput streaming={isStreaming} onSubmit={send} onStop={stop} />
</div>
```

- **The `Conversation` height is yours, by class.** Without it the conversation
  grows and pushes the page. It sticks to the end while the text arrives, lets
  go when the person scrolls up and shows "Ir para o fim".
- **`streaming` goes in both places**: on the `Message` that is arriving (it
  announces `aria-busy`, shows the indicator, hides the actions) and on
  `PromptInput` (it swaps send for stop and holds Enter).
- **The `Message` `children` is yours.** Render the markdown with the library
  the project already has; `copyValue` receives the raw text.
- `role` is `user` (bubble on the right), `assistant` (running text on the
  left) or `system` (a discreet line in the center).

## The field

`PromptInput`: Enter sends, Shift+Enter breaks the line, and Enter in the middle
of a keyboard composition does not send. Without `value`, it clears itself after
sending; with `value` and `onValueChange`, you do the clearing. `attachments` and
`actions` are slots: the piece does not pick files. `maxLength` with
`showCount` shows `120/4000`.

Do not use `Textarea` for a conversation, nor `PromptInput` for a form note:
one sends on every Enter, the other goes along with the form.

## Tool and approval

```tsx
<ToolCall
  name="emitir_nota"
  title="Emitir a nota da Clínica São Lucas"
  status={call.status}
  input={call.args}
  output={call.result}
  error={call.error}
  onApprove={() => approve(call.id)}
  onReject={() => reject(call.id)}
/>
```

`status` is `pending`, `running`, `done`, `error` or `approval`, each with an
icon and text. In `approval` the buttons appear outside the panel and the panel
opens by itself; the piece does not keep the decision, so you change the
`status`.

## Content generated outside the conversation

The summary that will live in an ordinary card carries the `AILabel`:

```tsx
<div className="flex items-center gap-2">
  <CardTitle>Resumo de agosto</CardTitle>
  <AILabel explanation="Escrito pelo assistente a partir das notas de agosto. Confira os valores antes de enviar ao contador." />
</div>
```

Write the explanation with the origin, the limit and what to check. Record
status is still a `Badge`; `AILabel` says only the origin. `aiLabelVariants`
comes along, for whoever needs the badge class on an element of their own.

## In React Native

The same five pieces in `@rivocode/ui-native/ai`, the only native path without
a peer. What changes: `Conversation` comes through `items`, `renderItem` and
`keyExtractor` over an inverted `FlatList`; `PromptInput` is controlled and
sends only through the button; `Message` has `onCopy` instead of `copyValue`;
and the `AILabel` explanation opens in a `Sheet`. Details in
[native.md](native.md).
