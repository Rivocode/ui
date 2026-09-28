---
category: Forms
---

# MaskedInput

A field with a mask driven by a pattern: `9` is a digit, `A` is a letter, `*`
is either, and the rest is a literal the mask inserts on its own.

Ready-made patterns: `cpf`, `cnpj`, `cep`, `telefone`, `data`, `hora`,
`placa`, `cartao`, `boleto` and `moeda`. It accepts a hand-written pattern,
such as `99-99/9999`.

`onValueChange` delivers the punctuated text and the raw one. **Store the
raw one**: punctuation changes over time and the data stops matching. Money
also comes out in cents, through `toCents()`, so the server receives an
integer instead of a floating point number.

The phone switches pattern between landline and mobile on its own, and so does
the boleto: the line starts on the bank pattern, of 47 digits, and moves to the
utility pattern, of 48 in four blocks (`84630000000-3 29990296202-4 …`), when
the first digit is 8, which is how every utility bill and every tax start. The
44 digits of the barcode, pasted from an optical reader or from a PDF, stay
unpunctuated: they are not the line, and the 47-slot punctuation on them would
lie.

CNPJ accepts letters: since July 2026 the Receita Federal issues alphanumeric
CNPJs, with a letter or digit in the first twelve slots and a digit in the two
check digits. The letter is uppercased on its own, and a digits-only CNPJ
still comes out the same. That is why `cnpj` opens the text keyboard on a
phone, and not the numeric one.

## The ten patterns

| Name | Pattern | Renders as |
|---|---|---|
| `cpf` | `999.999.999-99` | `123.456.789-01` |
| `cnpj` | `**.***.***/****-99` | `12.345.678/0001-90`, `12.ABC.345/01DE-35` |
| `cep` | `99999-999` | `58000-000` |
| `telefone` | `(99) 99999-9999` | `(83) 99999-1234` |
| `data` | `99/99/9999` | `05/08/2026` |
| `hora` | `99:99` | `14:30` |
| `placa` | `AAA9A99` | `ABC1D23` |
| `cartao` | `9999 9999 9999 9999` | `4111 1111 1111 1111` |
| `boleto` | `99999.99999 99999.999999 99999.999999 9 99999999999999` | `00190.00009 01149.718601 68524.522114 6 75860000102656` |
| `moeda` | - | `2.480,00` |

`moeda` is the only one without a pattern: in money the cents come first and
the position moves left with each digit, the opposite of everything else. The
first nine live in `MASKS`, and `MaskName` is the name of one of them. The
prop's `Mask` type accepts that name, `moeda`, or a hand-written pattern.

The raw value of `moeda` is the digits of what is on screen, with the leading
zero: `0,05` delivers `005`, and `12,00` delivers `1200`. The last two are
always the cents, and the native package delivers the same text.

A misspelled pattern name does not become a literal pattern:
`mask="dinheiro"` warns in the console in development and lets the text pass
through raw, instead of writing "dinheiro" inside the field, which is what the
previous version did.

## Checking the document

The mask adds the punctuation, and does not say whether the number exists.
What checks it is `isValidCpf` and `isValidCnpj`, through the check digits.
Both accept the text with or without punctuation, and `isValidCnpj` already
does the math for the alphanumeric CNPJ: each letter is worth its code minus
48.

CNH, voter ID, PIS, RENAVAM and license plate have their own: `isValidCnh`,
`isValidVoterId`, `isValidPis`, `isValidRenavam` and `isValidPlate`. The
boleto's typeable line is checked with `isValidBoletoLine`, and `parseBoleto`
reads the bank, the amount in cents and the due date from it. The
[Brazilian documents](/documentos-brasileiros) guide says what each check
verifies.

```tsx
const schema = z.object({
  cnpj: z.string().refine(isValidCnpj, 'CNPJ inválido'),
})
```

Validate on leaving the field, not on every keystroke: a half-typed document
is always invalid, and flagging someone who is still typing is noise.

## In the form

With `@rivocode/ui/form`, the field goes in through `forValue`, which wires
`onValueChange` to react-hook-form: the form stores the already masked text,
and the schema checks it with the validator, which accepts punctuated text.

```tsx
<FormField name="document" label="CNPJ do cliente">
  {(field) => <MaskedInput {...forValue(field)} mask="cnpj" />}
</FormField>
```

A value that arrives through `value` always shows with the mask, even when
raw: an `"11222333000181"` coming from the server shows as
`11.222.333/0001-81`.

## Masks outside the field

The same logic ships as functions, for text that the screen **shows** and
never receives typing into: the CPF column of a table, the CNPJ in a receipt
header, the phone that came back raw from the server.

| Function | What for |
|---|---|
| `applyMask(texto, mask)` | Applies by pattern name, raw pattern or `moeda` |
| `applyPattern(texto, molde)` | Applies a pattern directly, without going through the names |
| `applyCurrencyMask(texto)` | Money only, from right to left |
| `unmask(texto)` | Strips the punctuation and returns what the person typed |
| `toCents(texto)` | `1.234,56` becomes `123456`, with no floating point in between |
| `phonePatternFor(texto)` | Says which of the two phone patterns the text calls for |

```tsx
<TableCell>{applyMask(cliente.document, 'cnpj')}</TableCell>
```

`phonePatternFor` returns a pattern, not a text: a Brazilian phone has eight or
nine digits after the area code and the pattern changes mid-typing, so whoever
formats a phone by hand asks it first and passes the answer to `applyPattern`.

## In React Native

Translates, with the same masks: the ready-made names (`cpf`, `cnpj`, `cep`, `data`, `hora`, `placa`, `cartao`, `telefone`, `boleto` and `moeda`) and the hand-written mask, with `9` for a digit, `A` for a letter and `*` for both, come from a single file, shared by both packages.

What changes is `value`: here it is the clean value, without punctuation and with letters in upper case, because the mask belongs to the field and the data does not carry it. `onValueChange` delivers the clean value first and the masked text in the second argument, which is what the web delivers first. With `moeda`, the clean value is the same raw value as the web, the digits of what is on screen: `0,05` delivers `005`, and `12,00` delivers `1200`.
