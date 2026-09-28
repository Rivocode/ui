---
category: AI
---

# Conversation

The scrollable list of messages in a conversation with an assistant. It sticks
to the bottom while text arrives, stops sticking when the person scrolls up to
reread, and offers the "Ir para o fim" button to go back. Lives in
`@rivocode/ui/ai`.

```tsx
import { Conversation, Message, PromptInput } from '@rivocode/ui/ai'

<div className="flex h-[32rem] flex-col gap-3">
  <Conversation className="flex-1">
    {messages.map((message) => (
      <Message key={message.id} role={message.role} streaming={message.streaming}>
        {message.text}
      </Message>
    ))}
  </Conversation>
  <PromptInput onSubmit={send} />
</div>
```

**The height is yours, by class.** The conversation scrolls inside the space the
parent gives it; without a defined height it grows with the messages and pushes
the page, which is the opposite of a conversation.

## Sticking to the bottom, and letting go

While the person is at the bottom, every size change (a new message, a new
chunk of text, an image that loaded) scrolls to the bottom. When they scroll
up, the conversation lets go: text keeps arriving below and their reading does
not jump. The "Ir para o fim" button then appears, which goes back, sticks
again and disappears.

The return is smooth, and becomes a jump when the system asks for less motion.
`labels.scroll` changes the button's text.

## For the screen reader

The area is a `role="log"` region with `aria-live="polite"` and the name
"Conversa" (or whatever `label` says): a new message is announced when the
reader finishes the sentence, not in the middle of it. Together with the
`aria-busy` of a `Message` in `streaming`, the answer is read whole at the end,
not chunk by chunk.

The area takes keyboard focus, to scroll with the arrows.

## Empty

`empty` draws the house `EmptyState` when there is no message at all. The
`suggestions` become buttons, and a tap hands the text to `onSuggestion`.
Without `onSuggestion`, the suggestions do not appear: a button that does
nothing is worse than none.

```tsx
<Conversation
  empty={{
    title: 'Pergunte sobre as suas notas',
    description: 'O assistente lê as notas emitidas nesta conta, e nada além delas.',
    suggestions: ['Quanto faturei em agosto?', 'Quais notas vencem esta semana?'],
  }}
  onSuggestion={send}
/>
```

## Parts

`classNames` reaches `viewport` (the area that scrolls), `content` (the column
of messages), `empty`, `suggestions` and `scrollButton`.

## When not to use

- **A long list of identical rows** is `VirtualList`. `Conversation` draws
  every message, because a conversation has dozens, not thousands, and what it
  solves is sticking to the bottom. A log of ten thousand events calls for the
  virtualized list.
- **A history of events in order** is `Timeline`. `Timeline` looks back and
  receives nothing new while the person reads; `Conversation` exists precisely
  for what is arriving now.

## In React Native

Translates, on its own path `@rivocode/ui-native/ai`, on top of an inverted `FlatList`: the end of the conversation is the start of the list, so whoever is there stays there when the text grows, with no math at all. Scrolling up shows the same "Ir para o fim" button, and the list holds the reading position while the new message arrives below.

**The list comes through `items`**, like the whole package: `renderItem` draws a message and `keyExtractor` gives the key. The order is the web's (newest last), and the inversion belongs to the piece. `empty` with `suggestions` and `onSuggestion` cross over with the same names.

**The new message is announced**, like the web's `role="log"`: on Android through the live region, and on iOS through the system announcement, once per message and only when `streaming` ends. The spoken text is the loose text `renderItem` returns; whoever draws the message through their own component says the sentence in `announcement`, and `null` there waits.

The parts are styled through the same `classNames` as the web: `viewport` on the `FlatList`, `content` on its `contentContainerClassName`, `empty`, `suggestions` and `scrollButton`.
