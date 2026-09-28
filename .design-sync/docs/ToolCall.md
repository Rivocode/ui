---
category: AI
---

# ToolCall

The collapsible card of a tool call made by an assistant: the tool's name,
where it stands, the input and the output. When the call needs permission, it
brings the approve and decline buttons. It lives in `@rivocode/ui/ai`.

```tsx
import { ToolCall } from '@rivocode/ui/ai'

<ToolCall
  name="buscar_notas"
  title="Consultando as notas de agosto"
  status="done"
  input={{ mes: 8, ano: 2026 }}
  output={{ total: 3, valor: 5330 }}
/>
```

## The five states

| `status` | What the person sees |
| --- | --- |
| `pending` | clock and "Pendente", in neutral |
| `running` | spinning circle and "Rodando", in info; the card announces `aria-busy` |
| `done` | check and "Concluída", in success |
| `error` | x and "Erro", in danger; the panel opens on its own and shows the `error` |
| `approval` | hand and "Aguardando aprovação", in warning; the panel opens on its own |

**Color is never the only signal.** Each state comes out with an icon AND text,
and the text goes into the trigger's name: the screen reader hears
"buscar_notas, Consultando as notas de agosto, Rodando". `labels` changes the
texts, for another language.

## Input and output

`input` and `output` come out in the house `CodeBlock`. An object comes out as
indented JSON; text comes out as it came. The panel starts closed, because
whoever reads the conversation wants the answer and not the plumbing, and it
opens on a tap of the trigger. **With no input, output or error, there is no
trigger**: the header comes out as text, and not as a button that opens
nothing, announced as expanded and pointing to a panel that does not exist.

Long names and titles wrap to up to two lines, instead of being cut on one line;
the tool's full name stays in `title`, for whoever rests the pointer on it.

`defaultOpen` changes the starting point, and `open` with `onOpenChange`
controls it. Without `open`, the panel also opens on its own when `status`
**changes** to `error` or `approval`: a call born `running` that fails halfway
shows the error without waiting for a tap. Closed by hand, it only opens again
on the next state change.

## Approving before running

In `approval`, `onApprove` and `onReject` wire the two buttons. They sit
**outside the collapsible panel**, at the bottom of the card: a decision that
waits on the person does not hide behind a tap. The panel opens on its own, so
the person reads the arguments before deciding.

```tsx
<ToolCall
  name="emitir_nota"
  title="Emitir a nota da Clínica São Lucas"
  status="approval"
  input={{ cliente: 'Clínica São Lucas', valor: 3400 }}
  onApprove={() => approve(call.id)}
  onReject={() => reject(call.id)}
/>
```

Long text in `labels.approve` or `labels.reject` wraps inside the button, and
does not spill out of the card.

The piece does not keep the decision: whoever approved changes `status` to
`running`, and whoever declined changes it to `error` with the reason's
sentence.

## Parts

`classNames` reaches `trigger` (the header, whether the button or the text with
no panel), `name`, `status`, `panel`, `error` and `actions`.

## When not to use

- **Content sections that open** are `Accordion`. `Accordion` organizes text
  that already exists; `ToolCall` is an event with state, and the state is what
  the person reads first.
- **A single block that hides detail** is `Collapsible`. If there is no tool,
  state or approval (it is just "see more"), `Collapsible` does the same without
  the frame.

## In React Native

Translates, on its own path `@rivocode/ui-native/ai`, with the same `name`, `status`, `input`, `output`, `error`, `onApprove`, `onReject`, `labels`, `defaultOpen`, `open` and `onOpenChange`. `title` and `error` are `string`, because text on native lives inside a `Text`.

**Color is still not the only signal.** The package ships no icons, so each state comes out with a text mark (○, ✓, ✕, !) before the name, and `running` gets the spinner. The trigger tells the screen reader the tool's name and the state.

The parts are styled through the same `classNames` as the web, all six: `trigger`, `name`, `status`, `panel`, `error` and `actions`.
