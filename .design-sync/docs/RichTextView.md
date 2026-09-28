---
category: Typography
---

# RichTextView

Displays what `RichTextEditor` saved, with the same typography as the editor:
headings at the `Heading` size, code in the `Code` style, links in the `Link`
style. It lives in `@rivocode/ui/editor`, and **does not use Tiptap**: a page
that only reads loads no editor at all.

```tsx
import { RichTextView } from '@rivocode/ui/editor'

<RichTextView value={nota.descricao} empty="Sem descrição." />
```

## Why it is safe to display

The piece does not use `innerHTML`. It reads the HTML with a reader of its own,
keeps only the blocks and marks the editor writes (paragraph, `h2`, `h3`,
lists, quote, code block, rule, line break, bold, italic, underline,
strikethrough, code and link) and builds each one as a React element. The rest
has no way in:

- `script`, `style`, `iframe`, `img`, `svg` and form controls disappear along
  with their content.
- No attribute gets through: not `style`, not `class`, not `onclick`.
- A link only comes out with `http`, `https`, `mailto`, `tel` or a relative
  address, and always with `rel="noopener noreferrer nofollow"`. `javascript:`
  loses the address and only the text remains.
- An unknown tag (`span`, `div`, `font`) steps aside and leaves the text.

That is why there is no sanitizer to install. The care that remains yours is
the one for any HTML coming from the browser: if it is displayed through
**another** path (email, PDF, `dangerouslySetInnerHTML`), sanitize it on the
server. The `RichTextEditor` page says how.

## HTML or JSON

`value` accepts the HTML from `onValueChange` or the JSON from `onJsonChange`,
and both draw the same thing.

```tsx
<RichTextView value={nota.descricaoJson} />
```

The piece runs on the server: the reader does not depend on the DOM, so a
server-rendered page already comes out with the formatted text on the first
paint.

## Empty

`null`, an empty string and the `<p></p>` of a blank editor draw nothing. With
`empty`, the piece draws the sentence in its place, and marks the root with
`data-empty`:

```tsx
<RichTextView value={nota.descricao} empty={<Text tone="muted">Sem descrição.</Text>} />
```

## Width

The text takes the width it receives. For running reading, limit it with a
class: `className="max-w-prose"`.

A code block does not wrap lines: whatever goes past the width scrolls
sideways inside the block itself. When it scrolls, the block becomes a Tab stop
named "Bloco de código", so keyboard users can reach the end of the line with
the arrows.

## When not to use

- **Unformatted text** is `Text`. A note saved from a `Textarea` has no marks
  to draw, and passing plain text here would turn line breaks into spaces.
- **Editing** is `RichTextEditor`, which already shows the formatted content
  while it loads.
- **Code, a log or an API response** is `CodeBlock`, which numbers lines and
  copies.

## In React Native

Translates, in the main index `@rivocode/ui-native`, with the same `value` and `empty`. It reads the HTML from `onValueChange` and the JSON from `onJsonChange` of `RichTextEditor` through the **same reader as the web**, which is pure code shared between the two packages: there is no `WebView`, no peer, and nothing in the content executes.

Each block becomes a `View` and each mark becomes a nested `Text`: the heading is `Heading` (and announces itself as a header), a numbered list starts from the saved `start`, a quote comes out in the muted tone with a left border, a code block in a selectable mono font, and a link is `Link`, which opens through `Linking` and only with `http`, `https`, `mailto`, `tel` or a relative address.

**It does not live in a subpath.** On the web it comes from `@rivocode/ui/editor` because it shares the path with the editor; on the phone there is no editor, so there is no peer to separate, and the piece lives alongside `Text`.
