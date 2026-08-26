import { Button, DatePicker, Input } from '@rivocode/ui'
import { Form, FormField, forDate, useZodForm } from '@rivocode/ui/form'
import { z } from 'zod'

const schema = z.object({
  email: z.email('Escreva um email valido'),
  dueAt: z.date('Escolha a data'),
})

/** Emitir nota */
export function IssueInvoice() {
  const form = useZodForm(schema, {
    defaultValues: { email: 'financeiro@rivocode.com', dueAt: new Date(2026, 2, 3) },
  })

  return (
    <div className="w-80">
      <Form form={form} onSubmit={() => {}}>
        <FormField name="email" label="E-mail" description="Para onde vai a nota">
          {(field) => <Input {...field} placeholder="você@empresa.com" />}
        </FormField>

        <FormField name="dueAt" label="Vencimento">
          {(field) => <DatePicker {...forDate(field)} />}
        </FormField>

        <Button type="submit" className="self-start">
          Emitir
        </Button>
      </Form>
    </div>
  )
}
