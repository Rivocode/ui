---
category: Forms
---

# InputGroup

A frame that attaches text or a button to the field: `R$` before, `.com.br`
after, a search magnifier, a copy button.

The border and the focus ring move to the frame, and the inner field gives up
both. Without that you get two nested borders and two rings, and the whole
thing stops looking like a single field.

Comes with `InputPrefix`, `InputSuffix` and `InputAction`.

## In React Native

Translates, and the shape changes along with it: on the web the frame is composition (`InputGroup` outside, `Input`, `InputPrefix` and `InputAction` inside) and it disarms the field's border with a descendant selector. That selector does not exist in React Native, and whoever wrote the same tree there would get two nested borders with no way to remove the inner one. That is why the native frame draws the field: `value`, `onValueChange`, `prefix`, `suffix` and `actions` are its props. There is no `size`: control height is single on native, because a touch target does not shrink.

The inner pieces become `classNames` parts, with their names: `input`, `prefix`, `suffix` and `action`.
