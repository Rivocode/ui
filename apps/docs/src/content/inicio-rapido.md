A real screen, from scratch, with the pieces almost every application screen
has: a form that validates, a listing that knows how to load and fail, and a
notice at the end.

If you have not installed yet, start with [Installation](/instalacao).

## The skeleton

```tsx
import { RivoProvider } from '@rivocode/ui'
import './styles.css'

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <InvoiceScreen />
    </RivoProvider>
  )
}
```

`density="compact"` shrinks the height of every control at once. It is worth it
for an operations screen, where more rows fit in the same height; see
[Density](/densidade).

## A form that validates

The `@rivocode/ui/form` subpath brings React Hook Form and Zod together. The
schema is the source of truth: it validates and also gives the form its type.

```tsx
import { Button, Input } from '@rivocode/ui'
import { Form, FormField, useZodForm } from '@rivocode/ui/form'
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

      <FormField name="amount" label="Valor" render={(field) => <Input {...field} />} />

      <Button type="submit" loading={form.formState.isSubmitting}>
        Emitir nota
      </Button>
    </Form>
  )
}
```

`FormField` does not invent an `id`. It assembles label, control, help and
error inside the `Field`, and Base UI wires `aria-describedby` and
`aria-invalid` on its own for any of its controls that are inside.

## A listing that knows the three states

Every query has four end states: loading, succeeded, failed, and came back
empty. `DataTable` takes all four and draws each one, without the library
knowing what React Query is.

```tsx
import { Badge, DataTable } from '@rivocode/ui'

function InvoiceList({ query }) {
  return (
    <DataTable
      data={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      rowKey={(invoice) => invoice.id}
      empty={{
        title: 'Nenhuma nota por aqui',
        description: 'Quando você emitir a primeira, ela aparece nesta lista.',
      }}
      columns={[
        { key: 'number', header: 'Número' },
        { key: 'customer', header: 'Cliente' },
        { key: 'amount', header: 'Valor', align: 'right' },
        {
          key: 'status',
          header: 'Situação',
          align: 'right',
          cell: (invoice) => <Badge tone={invoice.paid ? 'success' : 'neutral'}>{invoice.status}</Badge>,
        },
      ]}
    />
  )
}
```

It works the same with a hand-written `fetch`, with SWR or with a server
component: what the table wants are the three signals, not the library that
produced them.

`hideOnMobile` on a column hides it on a narrow screen; use it for what can be
found out some other way.

## Notify without mounting a portal

```tsx
import { useToast } from '@rivocode/ui'

function IssueButton() {
  const toast = useToast()

  return (
    <Button
      onClick={async () => {
        await issue()
        toast.add({
          title: 'Nota 4816 emitida',
          description: 'O PDF foi enviado para o e-mail do cliente.',
        })
      }}
    >
      Emitir
    </Button>
  )
}
```

The toast viewport is already mounted by the Provider. You call `add` and the
notice shows up in the corner.

## What to read next

- [Themes and customization](/temas): dressing the library in the client's color
- [Density](/densidade): the same screen at two heights
- [For agents](/para-agents): the documentation in raw markdown
