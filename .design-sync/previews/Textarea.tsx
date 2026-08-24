import { Field, FieldDescription, FieldLabel, Textarea } from '@rivocode/ui'

export function ComRotulo() {
  return (
    <Field className="w-80">
      <FieldLabel>Observacao</FieldLabel>
      <Textarea placeholder="O que o cliente pediu" />
      <FieldDescription>Aparece no corpo da nota.</FieldDescription>
    </Field>
  )
}
