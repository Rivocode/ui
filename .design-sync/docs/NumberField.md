---
category: Forms
---

# NumberField

A number field with plus and minus.

Use it when the value has a known step and limit: quantity, installments, days
of term. For money, `MaskedInput` with a currency mask says more, because there
what matters is the punctuation and not the step.

The bare `Input` still serves for a loose number. The difference here is that
the keyboard arrows, scrolling and the buttons respect `min`, `max` and
`step`; the field never reaches a value the form rejects later.

```tsx
<Field>
  <FieldLabel>Parcelas</FieldLabel>
  <NumberField defaultValue={3} min={1} max={12} />
  <FieldDescription>De 1 a 12, sem juros.</FieldDescription>
</Field>
```

## In React Native

Translates, and becomes a stepper: minus, value, plus, which is the touch idiom. **`min` starts at 0**, and on the web it starts unbounded. It is not an oversight: the iPhone's numeric keyboard (`number-pad`) has no minus sign, so a negative number could only arrive through the minus button, and a field that goes below zero by tapping but does not let you type the same value is worse than a field that stops at zero. To accept negatives, pass a negative `min`: the stepper goes down to it, the field accepts a typed minus sign and switches to a keyboard that has the sign.

While typing, `max` applies on each key and `min` only on leaving the field: with `min={10}`, typing 25 passes through 2 without becoming 10. With a fractional `step` the keyboard becomes `decimal-pad`, comma and period both work as the separator, as on the web, and the step keeps its decimal places: 0,2 plus 0,1 gives 0,3. Plus and minus start from what is typed, and a value that arrives from outside in the middle of typing appears at once. The rest of the API also changes (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
