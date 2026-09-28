---
category: AI
---

# Message

A message in a conversation with an assistant: who is speaking, the content,
the copy and retry actions, and the indicator that the text is still
arriving. Lives in `@rivocode/ui/ai`.

```tsx
import { Message } from '@rivocode/ui/ai'

<Message role="user">Quanto faturei em agosto?</Message>
<Message role="assistant" copyValue={answer} onRetry={retry}>
  {answer}
</Message>
```

## The role decides the look

- `user` is the bubble on the right, on the accent background.
- `assistant` is running text on the left, without a bubble: it is where the
  long answer, the list and the table live, and a bubble squeezes all of that.
- `system` is the discreet line in the center, for "Conversa iniciada às
  14h02" and for the notice that the context changed.

Each message renders as an `article` with the speaker's name ("Você",
"Assistente", "Sistema"), and the screen reader moves from one to the next that
way. `author` swaps the name, for an assistant that has a name of its own.

`avatar` takes the house `Avatar` and sits on the speaker's side. On `system`
it does not render.

## The content is yours

`children` is what appears, and the piece interprets nothing: the caller
renders the markdown with the library it already has, and passes the result.
That is on purpose. Model markdown brings tables, code and links, and each
product decides what it accepts.

```tsx
<Message role="assistant" copyValue={raw}>
  {renderMarkdown(raw)}
</Message>
```

## Arriving

`streaming` says the text is still arriving. Three things change:

- the three dots appear after the text (or alone, before the first chunk),
  and stop pulsing when the system asks for less motion;
- the message announces `aria-busy`, and the screen reader waits for it to
  finish instead of reading each chunk that arrives;
- the actions disappear: copying half an answer and asking for another while
  the first has not even finished are the two taps nobody wants.

## Actions and error

`copyValue` turns on the copy button, with the text that goes to the
clipboard. Pass the raw text (the markdown, not what it draws), because that is
what the person pastes elsewhere. `onRetry` turns on "Tentar de novo".
`actions` takes your own buttons, after those two: like, dislike, save.

`error` is the answer that failed. The sentence renders below the content, with
an icon and in the danger tone, and the actions appear even with no content at
all.

```tsx
<Message
  role="assistant"
  error="A resposta foi interrompida. Tente de novo."
  onRetry={retry}
>
  {partial}
</Message>
```

## Parts

`classNames` reaches `avatar`, `bubble` (the `user` bubble, and the
`assistant` column), `content`, `indicator`, `error` and `actions`.

## When not to use

- **Content that is not a conversation turn** is `Card`. An AI-generated
  summary on a dashboard screen is a card with an `AILabel`, not a message:
  there is nobody asking and nobody to answer.
- **A list row with an icon, text and an action** is `Item`. A history of old
  conversations, with the title of each, is a list of `Item`; `Message` is what
  appears after the person opens one of them.
- **A person-to-person comment**, with date and author, is `Timeline`.
  `Message` assumes two sides taking turns, and alignment by role loses its
  meaning in a thread of five people.

## In React Native

Translates, on its own path `@rivocode/ui-native/ai`, with the same `role`, the same alignment, the same `author`, `avatar`, `streaming`, `onRetry`, `actions` and `error`. In `streaming` the message announces `busy` and hides the actions, as on the web.

**Copying is yours.** The web copies on its own through `copyValue`; here the piece has `onCopy`, because the phone's clipboard is `expo-clipboard`, a peer that lives in `@rivocode/ui-native/clipboard` and that the AI path cannot charge to whoever copies nothing. Loose text in `children` becomes `Text` in the house body; a node comes in as it came, for whoever renders markdown.

The parts are styled through the same `classNames` as the web: `avatar`, `bubble`, `content`, `indicator`, `error` and `actions`. `content` styles the `Text` that wraps loose text; a node that arrives ready comes in as it came.
