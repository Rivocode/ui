---
category: Data
---

# CodeBlock

Code as a block: an API response, a log line, a config snippet.

The scrolling is its own on purpose. JSON does not wrap, and without scrolling
in the block itself the long line pushes the page width, and the horizontal
overflow only shows up on the user's phone, never on the monitor of whoever
wrote it.

Its own scrolling only helps if the keyboard scrolls too. That is why the
block enters the Tab order, as a named region, and the arrow keys move it
sideways: whoever does not use a mouse reaches the end of the long line. The
name is the `title` when it is text, "Bloco de código" without it, and `label`
replaces both.

No syntax highlighting: highlighting keywords requires a grammar per language,
and that is weight every screen pays for what few use. Whoever needs it brings
their own and passes the result as children.

`lineNumbers` numbers the lines on the left, for whoever is going to cite a
line; the number stays out of the selection, otherwise copying the block brings
the numbers glued to the code. `copyable` puts the `Clipboard` in the corner,
with the block's own content.
