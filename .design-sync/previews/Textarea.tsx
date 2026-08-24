import { Field, FieldDescription, FieldLabel, Textarea } from '@rivocode/ui'

/** Com rótulo */
export function WithLabel() {
  return (
    <Field className="w-80">
      <FieldLabel>Observação</FieldLabel>
      <Textarea placeholder="O que o cliente pediu" />
      <FieldDescription>Aparece no corpo da nota.</FieldDescription>
    </Field>
  )
}
