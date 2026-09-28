---
category: Data
---

# Code

Code inside a sentence: a file name, a terminal command, a JSON key, a prop
name.

It is not `Kbd`. The key shadow promises "press this", and promising wrongly
costs more than promising nothing. `Kbd` is for the combination the person is
going to type, and this is for the text they are going to read or copy.

## When not to use

For a block (an API response, a log line, a config snippet), use `CodeBlock`,
which scrolls on its own. `Code` inside a paragraph with a long line stretches
the whole page.

## In React Native

Translates, and it goes inside a `Text`: `Abra o <Code>app.json</Code>` wraps along with the sentence around it. **The horizontal scroll the queue promised was never on this side:** a scroll bar inside a paragraph is a trap for the finger scrolling the screen, and whoever needs it is `CodeBlock` (an API response, a log line), which is another piece and has not ported yet. The argument is the reverse of this one: there, breaking a JSON in the middle changes what is written, and here breaking a long path in the middle is right, because the alternative is stretching the whole screen. The font size is not written: the nested `Text` inherits the one from the outer text, which is what the web's `0.9em` said. And `selectable` comes on, because the long press is the native gesture for copying. On Android the one selecting is the outer `Text`, and there it is the one that needs to carry the prop.
