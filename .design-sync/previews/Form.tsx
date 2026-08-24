import { Button, DatePicker, Input } from '@rivocode/ui'
import { Form, FormField, forDatePicker, useZodForm } from '@rivocode/ui/form'
import { z } from 'zod'

const schema = z.object({
  email: z.email('Escreva um email valido'),
  vencimento: z.date('Escolha a data'),
})

/** Emitir nota */
export function IssueInvoice() {
  const form = useZodForm(schema, {
    defaultValues: { email: 'financeiro@rivocode.com', vencimento: new Date(2026, 2, 3) },
  })

  return (
    <div className="w-80">
      <Form form={form} onSubmit={() => {}}>
        <FormField name="email" label="E-mail" description="Para onde vai a nota">
          {(campo) => <Input {...campo} placeholder="você@empresa.com" />}
        </FormField>

        <FormField name="vencimento" label="Vencimento">
          {(campo) => <DatePicker {...forDatePicker(campo)} />}
        </FormField>

        <Button type="submit" className="self-start">
          Emitir
        </Button>
      </Form>
    </div>
  )
}
