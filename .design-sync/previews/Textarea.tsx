import { Field, FieldDescription, FieldLabel, Textarea } from '@rivocode/ui'

/** With label */
export function WithLabel() {
  return (
    <Field className="w-80">
      <FieldLabel>Observação</FieldLabel>
      <Textarea placeholder="O que o cliente pediu" />
      <FieldDescription>Aparece no corpo da nota.</FieldDescription>
    </Field>
  )
}

/** In the three sizes */
export function Sizes() {
  return (
    <div className="flex w-80 flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Field key={size}>
          <FieldLabel>Observação, tamanho {size}</FieldLabel>
          <Textarea size={size} rows={2} placeholder="O que o cliente pediu" />
        </Field>
      ))}
    </div>
  )
}
