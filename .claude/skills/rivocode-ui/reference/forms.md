# Formulários: `@rivocode/ui/form`

Não vem no pacote principal. É dependência opcional, e chega pelo mesmo
provider. Instale junto: `react-hook-form`, `zod`, `@hookform/resolvers`.

React Hook Form com Zod. O esquema é a fonte da verdade: valida e ainda dá o
tipo do formulário. O controle vem por função, não por clonagem do filho.

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

CPF e CNPJ se conferem pelo dígito verificador com `isValidCpf` e
`isValidCnpj`, do pacote principal: `z.string().refine(isValidCnpj, 'CNPJ
inválido')`. Os dois já aceitam o CNPJ alfanumérico e o texto com máscara. Os
outros documentos seguem o mesmo molde: `isValidCnh`, `isValidVoterId` (título
de eleitor), `isValidPis` (PIS, PASEP, NIT e NIS), `isValidRenavam` e
`isValidPlate` (placa antiga e Mercosul). Nenhuma consulta cadastro: elas dizem
que o número pode existir, e não que está ativo. As sete existem com o mesmo
nome no `@rivocode/ui-native`.

A chave Pix se confere com `isValidPixKey`, que quer a chave como o DICT a
guarda: CPF e CNPJ **sem** pontuação, e-mail em minúsculas, celular com `+55` e
a chave aleatória com os hifens. Tire a máscara antes de conferir. O copia e
cola sai de `buildPixPayload`, e o `PixCode` o desenha.

O `FormField` não inventa `id`: ele monta rótulo, controle, ajuda e erro dentro
do `Field`, e a Base UI liga `aria-describedby` e `aria-invalid` sozinha.

Controle que não fala a língua do React Hook Form entra por um adaptador. O
nome diz o **formato**, e não a peça, porque cada um serve a família inteira:

| Adaptador | Serve |
|---|---|
| `forValue` | Tudo que tem `value` e `onValueChange`: `Select`, `RadioGroup`, `ToggleGroup`, `NumberField`, `Slider`, `OTPField`, `Combobox`, `TreeSelect` |
| `forChecked` | Tudo que tem `checked` e `onCheckedChange`: `Checkbox` e `Switch` |
| `forDate` | O `DatePicker` e o `DateRangePicker`, cujo valor é `Date` |

```tsx
<FormField name="vencimento" label="Vencimento">
  {(field) => <DatePicker {...forDate(field)} />}
</FormField>

<FormField name="forma" label="Forma de pagamento">
  {(field) => <Select {...forValue(field)} items={FORMAS} />}
</FormField>
```

`forValue` devolve o valor com o tipo que o schema deu a ele, então controle
tipado encaixa sem `as`. Os nomes antigos (`forSelect`, `forCheckbox`,
`forDatePicker`) continuam valendo e apontam para os mesmos adaptadores.

## Texto com formatação: `@rivocode/ui/editor`

Descrição de serviço, cláusula, observação com lista: `RichTextEditor`, no
subcaminho próprio, com os peers opcionais do Tiptap 3 (`@tiptap/react`,
`@tiptap/pm`, `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extensions`).
O valor é HTML, e o editor em branco entrega `""`, então `min(1)` recusa o
vazio. Entra pelo `forValue`, com o `onBlur` do campo para ele contar como
tocado, e o `defaultValues` precisa da string vazia:

```tsx
import { RichTextEditor } from '@rivocode/ui/editor'

const schema = z.object({ descricao: z.string().min(1, 'Descreva o serviço.') })
const form = useZodForm(schema, { defaultValues: { descricao: '' } })

<FormField name="descricao" label="Descrição do serviço">
  {(field) => <RichTextEditor {...forValue(field)} onBlur={field.onBlur} maxLength={2000} />}
</FormField>
```

`maxLength` conta texto, e não marca de HTML. Para mostrar o que foi salvo,
`RichTextView`, do mesmo caminho: não usa `innerHTML` nem carrega o Tiptap, e
lê o HTML ou o JSON do `onJsonChange`. Observação curta, sem negrito nem lista,
continua sendo `Textarea`.
