---
category: Forms
---

# CurrencyInput

The money field in reais. The value goes in and out in **whole cents**
(`123456` is R$ 1.234,56), typing moves from right to left as on a card
machine, and the "R$" is drawn beside it, outside the value.

```tsx
const [cents, setCents] = useState<number | null>(null)

<Field>
  <FieldLabel>Valor da cobrança</FieldLabel>
  <CurrencyInput value={cents} onValueChange={setCents} />
</Field>
```

Each key pushes the digits to the left: `1` shows `0,01`, `12` shows `0,12`,
`123456` shows `1.234,56`. The punctuation comes from `Intl.NumberFormat` in
`pt-BR`, and the phone keyboard opens on the numeric one. An empty field is
`null`, not zero: "did not type" and "typed zero" are different answers in a
form, and zero is typed with the `0` key.

**Store the cents.** The server receives an integer, with no floating point in
between, and the punctuation is a screen concern. The field stops at twelve
digits, R$ 9.999.999.999,99, which is where the integer still fits
comfortably.

## Pasting

Pasting replaces the value, and the pasted text is read the way the person
would write it: `R$ 1.234,56`, `1234,56`, `1.234,5` and `1234.56` go in as
R$ 1.234,56, and `150` goes in as R$ 150,00. The cents separator is the comma
or the dot followed by one or two digits; the others are thousands. The sign
comes from `-`, before or after the number, or from accounting parentheses:
`(10,00)` is R$ -10,00.

The pasted text is rejected whole, and the existing value stays, when it is not
just a value: text without a number, text mixed with the number
(`R$ 10 - desconto 2`, `Total: R$ 10,00`) and a value with more than twelve
digits. Nothing is silently cut to fit.

When disabled, the field stays out of the form, like any disabled HTML field.
The screen reader hears the number and, in the description, "em reais": the
"R$" drawn beside it is visual only.

## Sign

Without `allowNegative`, `-` does not go in, neither typed nor pasted. With it,
a `-` anywhere in the field sets the sign, and a second `-` removes it:

```tsx
<CurrencyInput value={adjustment} onValueChange={setAdjustment} allowNegative />
```

The iPhone numeric keyboard has no sign, so with `allowNegative` the field
opens the text keyboard on the web, and the numbers-and-punctuation one on
native.

## Limits

`min` and `max` are in cents. Outside them the field marks itself invalid, with
the danger border and `aria-invalid`, and **nothing is corrected on its own**:
changing the money value the person typed, without them seeing, is the worst
mistake a field like this can make. The message stating the limit belongs to
the form, as in `TimeField`. An empty field is not invalid because of `min`:
required is another rule, and it also belongs to the form.

```tsx
<CurrencyInput value={cents} onValueChange={setCents} min={1_000} max={500_000} />
```

## In a form

`forValue` from `@rivocode/ui/form` wires the field to React Hook Form:
`onValueChange` already delivers the number the schema expects.

```tsx
const schema = z.object({
  amount: z.number({ message: 'Informe o valor' }).int().min(100, 'O mínimo é R$ 1,00'),
})

const form = useZodForm(schema, { defaultValues: { amount: null } })

<FormField name="amount" label="Valor da cobrança">
  {(field) => <CurrencyInput {...forValue(field)} onBlur={field.onBlur} />}
</FormField>
```

`forValue` passes the `ref` through, and a submit with errors puts focus on the
field, but it does not pass `onBlur` through; pass it by hand when the schema
validates on leaving the field. In a native HTML form, without React Hook Form,
`name` puts the cents in a hidden field: what reaches the server is `123456`,
not `1.234,56`.

## Parts

`classNames` reaches each node by name: `input` and `prefix` (the "R$").
`className` dresses the root, which wraps the two.

## When not to use

- **A quantity with a step**, such as installments, items or days of term, is
  `NumberField`: there the value moves one by one with the buttons and the
  arrows, and what matters is the limit, not the punctuation.
- **Money that needs a mask alongside other masks**, in the same
  configuration-generated list of fields, is `MaskedInput` with
  `mask="moeda"`. It delivers the punctuated text and the raw one, and the cents
  come out through `toCents()`; it has no sign, no limit and no smart pasting.
- **A value the screen only shows** is formatted text, not a disabled field:
  use `currency()` in a cell or in `Stat`.

## In React Native

Translates, with the same math: the value in cents, typing that moves from right to left, the `-` that adds and removes the sign and the reading of pasted text live in a single file, shared by both packages. The field is controlled, like all of native: `value` and `onValueChange` are required.

React Native does not report when the person pastes, so the field reads the selection from before the change to know what went in on top. With `allowNegative`, the keyboard becomes the numbers-and-punctuation one, which is the one with the sign on the iPhone. There is no `name`: a hidden form does not exist on the phone.

The parts are styled through the same `classNames` as the web: `input` and `prefix`, the latter on the "R$" text.
