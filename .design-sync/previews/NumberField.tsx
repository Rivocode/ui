import { Field, FieldDescription, FieldLabel, NumberField } from '@rivocode/ui'

export function ComRotulo() {
  return (
    <Field className="w-56">
      <FieldLabel>Parcelas</FieldLabel>
      <NumberField defaultValue={3} min={1} max={12} />
      <FieldDescription>De 1 a 12, sem juros.</FieldDescription>
    </Field>
  )
}

export function Desabilitado() {
  return (
    <div className="w-56">
      <NumberField defaultValue={1} disabled />
    </div>
  )
}
