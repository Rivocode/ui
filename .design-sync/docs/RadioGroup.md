---
category: Forms
---

# RadioGroup

Groups the `Radio`s and takes care of the single choice and arrow-key
navigation. Pass `aria-label` or point to a heading with `aria-labelledby`:
without that the group exists for the mouse and not for the screen reader.

## In React Native

Translates with `items` on the root: there is no standalone `Radio` to compose, and everything is controlled.

**`label` is the web's `aria-label` under another name.** The page over there already demanded it: without a name, the group exists for the finger and not for the screen reader. Here there was no way to demand it, and the hole was worse than a missing prop: the form subpath's `forValue` already delivered `accessibilityLabel`, but the type is closed and a JSX spread does not check excess properties, so the name was **silently discarded with TypeScript green**. Today `forValue` delivers the `FormField`'s label also as `label`, and the group comes out named without repeating the text.

It draws nothing: the visible text belongs to the `Field`, as with `Select` and `Combobox`.
