# Formulários: `@rivocode/ui/form`

Não vem no pacote principal. É dependência opcional, e chega pelo mesmo
provider. Instale junto: `react-hook-form`, `zod`, `@hookform/resolvers`.

React Hook Form com Zod. O esquema é a fonte da verdade: valida e ainda dá o
tipo do formulário. O controle vem por função, não por clonagem do filho.

```tsx
import { Form, FormField, useZodForm } from '@rivocode/ui/form'
import { Input } from '@rivocode/ui'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  amount: z.string().min(1, 'Informe o valor'),
})

function InvoiceForm({ onIssue }: { onIssue: (data: unknown) => void }) {
  const form = useZodForm(schema)

  return (
    <Form form={form} onSubmit={onIssue}>
      <FormField
        name="email"
        label="E-mail do cliente"
        description="Para onde vai a nota"
        render={(field) => <Input {...field} type="email" />}
      />
      <Button type="submit" loading={form.formState.isSubmitting}>
        Emitir nota
      </Button>
    </Form>
  )
}
```

O `FormField` não inventa `id`: ele monta rótulo, controle, ajuda e erro dentro
do `Field`, e a Base UI liga `aria-describedby` e `aria-invalid` sozinha.

Controle que não fala a língua do React Hook Form entra por um adaptador:
`forDatePicker`, `forSelect` e `forCheckbox`. Eles traduzem o `onChange` do
campo para o que a peça espera.

```tsx
<FormField name="vencimento" label="Vencimento" render={(field) => (
  <DatePicker {...forDatePicker(field)} />
)} />
```
