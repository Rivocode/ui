# Forms: `@rivocode/ui/form`

It does not come in the main package. It is an optional dependency, and it
arrives through the same provider. Install alongside: `react-hook-form`, `zod`,
`@hookform/resolvers`.

React Hook Form with Zod. The schema is the source of truth: it validates and
also gives the form's type. The control comes through a function, not by
cloning the child.

```tsx
import { Form, FormField, useZodForm } from '@rivocode/ui/form'
import { Button, Input } from '@rivocode/ui'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  amount: z.string().min(1, 'Informe o valor'),
})

function InvoiceForm({ onIssue }: { onIssue: (data: unknown) => void }) {
  const form = useZodForm(schema)

  return (
    <Form form={form} onSubmit={onIssue}>
      <FormField name="email" label="E-mail do cliente" description="Para onde vai a nota">
        {(field) => <Input {...field} type="email" />}
      </FormField>
      <Button type="submit" loading={form.formState.isSubmitting}>
        Emitir nota
      </Button>
    </Form>
  )
}
```

CPF and CNPJ are checked by their check digit with `isValidCpf` and
`isValidCnpj`, from the main package: `z.string().refine(isValidCnpj, 'CNPJ
inválido')`. Both already accept the alphanumeric CNPJ and masked text. The
other documents follow the same pattern: `isValidCnh`, `isValidVoterId` (voter
ID), `isValidPis` (PIS, PASEP, NIT and NIS), `isValidRenavam` and
`isValidPlate` (old and Mercosul plate). None of them looks up a registry: they
say the number can exist, not that it is active. All seven exist with the same
name in `@rivocode/ui-native`.

A Pix key is checked with `isValidPixKey`, which wants the key as the DICT
stores it: CPF and CNPJ **without** punctuation, e-mail in lowercase, mobile
with `+55` and the random key with its hyphens. Strip the mask before checking.
The copy-and-paste code comes from `buildPixPayload`, and `PixCode` draws it.

Money is `CurrencyInput`, which delivers integer cents (`number | null`)
through `onValueChange` and goes into `FormField` through `{...forValue(field)}`,
with the schema as `z.number().int()`. `min` and `max` are in cents and only
mark the field invalid: the message belongs to the schema.

A signature is `SignaturePad`, which delivers `SignatureValue | null` through
`onValueChange` and goes into `FormField` through `{...forValue(field)}`. Empty
is `null`, so the schema is
`z.custom<SignatureValue | null>().refine((v) => v !== null, 'Assine para continuar')`.
The file comes from `signatureToSvg` or from `await signatureToPng(value)`.

A boleto is `MaskedInput` with `mask="boleto"`, which punctuates the bank line
and switches to the utility-bill one on its own when the first digit is 8.
`isValidBoletoLine` checks all the check digits, and `parseBoleto(line)`
returns `bank`, `amount` in cents and `dueDate`, or `null` when the line does
not check out. The due-date factor went back to 1000 on 22/02/2025, so pass
`{ today }` when the boleto is old: without it the date closest to today wins.

`FormField` does not invent an `id`: it assembles label, control, help and
error inside the `Field`, and Base UI wires `aria-describedby` and
`aria-invalid` on its own.

A control that does not speak React Hook Form's language comes in through an
adapter. The name says the **shape**, not the piece, because each one serves
the whole family:

| Adapter | Serves |
|---|---|
| `forValue` | Everything that has `value` and `onValueChange`: `MaskedInput`, `Select`, `RadioGroup`, `ToggleGroup`, `NumberField`, `Slider`, `OTPField`, `Combobox`, `TreeSelect`, and `DateRangePicker` with the period as text (`IsoDateRange \| null`) |
| `forChecked` | Everything that has `checked` and `onCheckedChange`: `Checkbox` and `Switch` |
| `forDate` | `DatePicker`, whose value is a `Date` |

```tsx
<FormField name="vencimento" label="Vencimento">
  {(field) => <DatePicker {...forDate(field)} />}
</FormField>

<FormField name="forma" label="Forma de pagamento">
  {(field) => <Select {...forValue(field)} items={FORMAS} />}
</FormField>
```

`forValue` returns the value with the type the schema gave it, so a typed
control fits without `as`.

## Formatted text: `@rivocode/ui/editor`

Service description, contract clause, a note with a list: `RichTextEditor`, in
its own subpath, with Tiptap 3's optional peers (`@tiptap/react`, `@tiptap/pm`,
`@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extensions`). The value is HTML,
and the blank editor delivers `""`, so `min(1)` refuses the empty one. It comes
in through `forValue`, with the field's `onBlur` so it counts as touched, and
`defaultValues` needs the empty string:

```tsx
import { RichTextEditor } from '@rivocode/ui/editor'

const schema = z.object({ descricao: z.string().min(1, 'Descreva o serviço.') })
const form = useZodForm(schema, { defaultValues: { descricao: '' } })

<FormField name="descricao" label="Descrição do serviço">
  {(field) => <RichTextEditor {...forValue(field)} onBlur={field.onBlur} maxLength={2000} />}
</FormField>
```

`maxLength` counts text, not HTML markup. To show what was saved,
`RichTextView`, from the same path: it does not use `innerHTML` nor load
Tiptap, and it reads the HTML or the JSON from `onJsonChange`. A short note,
without bold or lists, is still `Textarea`.
