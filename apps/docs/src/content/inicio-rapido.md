Uma tela de verdade, do zero, com os pedaços que quase toda tela de aplicação
tem: um formulário que valida, uma listagem que sabe carregar e falhar, e um
aviso no fim.

Se ainda não instalou, comece pela [Instalação](/instalacao).

## O esqueleto

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

`density="compact"` encolhe a altura de todo controle de uma vez. Vale para tela
de operação, onde cabe mais linha na mesma altura, veja
[Densidade](/densidade).

## Um formulário que valida

O subcaminho `@rivocode/ui/form` junta React Hook Form e Zod. O schema é a
fonte da verdade: ele valida e ainda dá o tipo do formulário.

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

O `FormField` não inventa `id`. Ele monta rótulo, controle, ajuda e erro dentro
do `Field`, e a Base UI liga `aria-describedby` e `aria-invalid` sozinha para
qualquer controle dela que esteja lá dentro.

## Uma listagem que conhece os três estados

Toda consulta tem quatro finais: carregando, deu certo, deu errado, e veio
vazia. O `DataTable` recebe os quatro e desenha cada um, sem a biblioteca saber
o que é React Query.

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

Funciona igual com `fetch` na mão, com SWR ou com server component: o que a
tabela quer são os três sinais, não a biblioteca que os produziu.

`hideOnMobile` numa coluna some com ela na tela estreita, use para o que dá
para descobrir de outro jeito.

## Avisar sem montar portal

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

O viewport de avisos já está montado pelo Provider. Você chama `add` e o aviso
aparece no canto.

## O que ler depois

- [Temas e personalização](/temas): vestir a biblioteca com a cor do cliente
- [Densidade](/densidade): a mesma tela em duas alturas
- [Para agents](/para-agents): a documentação em markdown cru
