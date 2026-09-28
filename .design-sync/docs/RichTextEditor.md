---
category: Forms
---

# RichTextEditor

The text field with formatting: bold, italic, underline, strikethrough, code,
two heading levels, lists, quote, code block and link, with undo, redo and
clear formatting. It delivers the document as HTML, and `RichTextView` displays
what it saved with the same typography. It lives in `@rivocode/ui/editor`, on
top of Tiptap 3.

```bash
npm install @tiptap/react @tiptap/pm @tiptap/core @tiptap/starter-kit @tiptap/extensions
```

The five are **optional** peers: whoever does not import `@rivocode/ui/editor`
installs none of them, and the rest of the library does not reach them
(`check:chart` guards the boundary, as it does with Recharts).

```tsx
import { Field, FieldLabel, FieldDescription } from '@rivocode/ui'
import { RichTextEditor } from '@rivocode/ui/editor'

const [descricao, setDescricao] = useState('')

<Field>
  <FieldLabel>Descrição do serviço</FieldLabel>
  <RichTextEditor
    value={descricao}
    onValueChange={setDescricao}
    placeholder="O que foi feito, e para quem"
    maxLength={2000}
  />
  <FieldDescription>Sai no corpo da nota, abaixo dos itens.</FieldDescription>
</Field>
```

## The value

`value` and `defaultValue` are HTML, and `onValueChange` returns the whole
document as HTML on every change. **The blank editor delivers an empty
string**, not `<p></p>`: that is what lets `z.string().min(1)` reject the empty
field with no special rule.

Changing `value` from outside replaces the document without firing
`onValueChange`, so the controlled field does not loop.

`onJsonChange` delivers the same document in Tiptap's JSON format. Store the
JSON when the text will be displayed on the phone or needs to be read by a
machine; `RichTextView` reads both formats.

With `name`, the HTML travels in a hidden `input`, and the field joins the
submission of a plain `<form>`.

## Toolbar and shortcuts

The bar is a `Toolbar`: **a single Tab stop**, and the arrows move between the
buttons. Each state button is a `Toggle` with `aria-pressed`, grouped in a
named `ToggleGroup` ("Estilo do texto", "Títulos", "Listas", "Blocos"), and
each one states its own shortcut in `aria-keyshortcuts` and in the tooltip that
opens on hover or focus.

On a narrow screen the bar wraps **by group**, and never in the middle of one:
undo, redo and clear formatting move down together, and the separator between
groups disappears when the next group opens the line.

| Action | Shortcut |
|---|---|
| Bold, italic, underline | `Ctrl`+`B`, `Ctrl`+`I`, `Ctrl`+`U` |
| Strikethrough, code | `Ctrl`+`Shift`+`S`, `Ctrl`+`E` |
| Heading, subheading | `Ctrl`+`Alt`+`2`, `Ctrl`+`Alt`+`3` |
| Bulleted list, numbered list | `Ctrl`+`Shift`+`8`, `Ctrl`+`Shift`+`7` |
| Quote, code block | `Ctrl`+`Shift`+`B`, `Ctrl`+`Alt`+`C` |
| Link | `Ctrl`+`K` |
| Undo, redo | `Ctrl`+`Z`, `Ctrl`+`Shift`+`Z` |
| Clear formatting | `Ctrl`+`\` |

On the Mac, `Ctrl` is `⌘`. Heading and subheading come out as `h2` and `h3`:
the `h1` belongs to the surrounding page, and a form field does not compete
with its outline. Pasted HTML with `h1` or `h4` becomes a paragraph.

## Link

`Ctrl`+`K` or the button opens a panel with the address. What is typed without
a protocol gets what is missing: `rivocode.com.br` becomes
`https://rivocode.com.br`, and `nf@rivocode.com.br` becomes `mailto:`. **Only
`http`, `https`, `mailto`, `tel` and relative addresses pass**; `javascript:`
is rejected with the explanation in the field itself. With the cursor inside a
link, the button stays pressed, with `aria-pressed="true"`, and the panel
offers "Remover link".

The panel is a form of its own, and submitting it does not submit the form
around the editor.

## Pasting

Pasting from Word, Google Docs or a web page brings no color, font, size, class
or image: the document only accepts what the bar knows how to do, and the rest
falls away. Real bold stays; the fake bold Google Docs wraps around everything
does not.

## Limit

`maxLength` counts **text characters**, not HTML: `<strong>Nota</strong>`
counts 4. The counter shows in the footer, is read by the screen reader as "120
de 2000 caracteres" on entering the field, and turns to the danger tone at the
ceiling, with the notice "Limite de 2000 caracteres atingido." in a polite
region. Typing and pasting that would go past the ceiling are rejected.

Saved content longer than the ceiling opens whole, and only accepts deleting:
cutting someone's text on opening is silent data loss.

## In a form

Inside `Field`, `FieldLabel` names the text, `FieldDescription` and
`FieldError` describe it, and the `Field`'s `invalid` paints the frame and
announces `aria-invalid`. With `@rivocode/ui/form`, the adapter is `forValue`,
plus `onBlur` so the field counts as touched:

```tsx
import { Form, FormField, forValue, useZodForm } from '@rivocode/ui/form'
import { RichTextEditor } from '@rivocode/ui/editor'
import { z } from 'zod'

const schema = z.object({
  descricao: z.string().min(1, 'Descreva o serviço.'),
})

function ServiceForm() {
  const form = useZodForm(schema, { defaultValues: { descricao: '' } })

  return (
    <Form form={form} onSubmit={salvar}>
      <FormField name="descricao" label="Descrição do serviço">
        {(field) => <RichTextEditor {...forValue(field)} onBlur={field.onBlur} maxLength={2000} />}
      </FormField>
      <Button type="submit">Salvar</Button>
    </Form>
  )
}
```

The `defaultValues` with an empty string is not a detail: without it `value`
arrives `undefined` on the first render, and the editor starts uncontrolled.

Outside `Field`, give the name with `aria-label` and paint the error with
`invalid`.

## States

- **`readOnly`**: the bar disappears, the text stays selectable and copyable,
  and the field announces `aria-readonly`.
- **`disabled`**: bar and text locked, in the dimmed tone, with
  `aria-disabled`. Inside a disabled `Field`, it locks on its own.
- **`invalid`**: danger frame and `aria-invalid`.
- **Loading on the server**: the editor does not mount on the server
  (`immediatelyRender: false`), and in its place comes the already formatted
  content, through `RichTextView`. A server-rendered page shows the text on the
  first paint, and it becomes editable when the JavaScript arrives.

## What reaches the server

The HTML comes from an editor that only writes what the bar knows how to do,
and `RichTextView` only displays that. But the server receives whatever the
browser sends, and **whoever calls your API is not required to use the
editor**. If the saved HTML is displayed by another path (email, PDF,
`dangerouslySetInnerHTML`), run it through a sanitizer on the server, such as
`sanitize-html` or DOMPurify, with the same tag list. `RichTextView` does not
need this: it does not use `innerHTML`.

## Names

The names of the bar, the panel and the counter come out in Portuguese, and
`labels` swaps whichever ones you pass, one by one:

```tsx
<RichTextEditor
  aria-label="Description"
  labels={{
    toolbar: 'Formatting',
    bold: 'Bold',
    count: (count, max) => `${count} of ${max} characters`,
  }}
/>
```

## Parts

`classNames` reaches `toolbar`, `content` (the editable area), `footer` and
`count`. The minimum height is three controls; to scroll inside, set the
ceiling through the part: `classNames={{ content: 'max-h-96 overflow-y-auto' }}`.

## When not to use

- **A note, a reason, a short comment** is `Textarea`. Text with no bold and no
  lists does not need a toolbar, and `Textarea` stores plain text, which any
  system reads. `RichTextEditor` stores HTML.
- **A message to an assistant** is `PromptInput`: Enter sends. In
  `RichTextEditor`, Enter opens a new paragraph.
- **Showing what was saved** is `RichTextView`. A `RichTextEditor` with
  `readOnly` loads all of Tiptap to display static text.

## In React Native

Does not port, by decision, and it is not queued: the question left to decide is not about gesture, it is about the engine.

**The web editor does not cross over.** It is Tiptap on top of ProseMirror, which lives on the browser's `contenteditable`, and React Native has no `contenteditable`. The two ways out are another product: a `WebView` with the same editor inside, which brings `react-native-webview` as a native module peer, a keyboard and selection that are not the system's, and text the screen reader reads through the page's path and not the app's; or a native rich text library, which neither reads nor writes the same document. Neither is the same piece with another API.

**And the toolbar is a desktop surface.** It is a `Toolbar`, which also does not port: a single tab stop with arrows between the buttons, over a selection made with the pointer. On touch, formatting a snippet means selecting with the finger that covers the snippet, and fifteen buttons do not fit above the keyboard.

**On the phone, the answer is to split the work.** What gets written on the phone is short text, and the field is `Textarea`. What was written formatted on the web is read with `RichTextView`, which ports with no peer and reads the same HTML and the same JSON.
