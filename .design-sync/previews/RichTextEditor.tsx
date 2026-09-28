import { Button, Field, FieldDescription, FieldLabel } from '@rivocode/ui'
import { RichTextEditor, RichTextView } from '@rivocode/ui/editor'
import { Form, FormField, forValue, useZodForm } from '@rivocode/ui/form'
import { useState } from 'react'
import { z } from 'zod'

const SERVICE =
  '<h2>Consultoria de agosto</h2><p>Revisão do fechamento com <strong>ISS retido</strong> ' +
  'e conferência das notas de entrada.</p><ul><li><p>12 horas de análise</p></li>' +
  '<li><p>Relatório entregue em <a href="https://rivocode.com.br">rivocode.com.br</a></p></li></ul>'

/** Descrição do serviço */
export function ServiceDescription() {
  const [html, setHtml] = useState(SERVICE)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Field>
        <FieldLabel>Descrição do serviço</FieldLabel>
        <RichTextEditor
          value={html}
          onValueChange={setHtml}
          placeholder="O que foi feito, e para quem"
          maxLength={2000}
        />
        <FieldDescription>Sai no corpo da nota, abaixo dos itens.</FieldDescription>
      </Field>

      <RichTextView value={html} empty="Sem descrição." className="max-w-prose" />
    </div>
  )
}

const schema = z.object({
  descricao: z.string().min(1, 'Descreva o serviço.'),
})

/** No formulário, com erro */
export function InForm() {
  const form = useZodForm(schema, { defaultValues: { descricao: '' } })

  return (
    <div className="w-full max-w-2xl">
      <Form form={form} onSubmit={() => {}}>
        <FormField name="descricao" label="Descrição do serviço">
          {(field) => (
            <RichTextEditor
              {...forValue(field)}
              onBlur={field.onBlur}
              placeholder="O que foi feito, e para quem"
            />
          )}
        </FormField>
        <Button type="submit" className="self-start">
          Salvar
        </Button>
      </Form>
    </div>
  )
}

/** Só leitura e desabilitado */
export function ReadOnlyAndDisabled() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <RichTextEditor aria-label="Descrição aprovada" readOnly defaultValue={SERVICE} />
      <RichTextEditor
        aria-label="Descrição travada"
        disabled
        defaultValue="<p>A nota já foi emitida, e a descrição não muda mais.</p>"
      />
    </div>
  )
}
