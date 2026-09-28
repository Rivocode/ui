import { Field, FieldDescription, FieldLabel, NumberField } from '@rivocode/ui'

/** Com rótulo */
export function WithLabel() {
  return (
    <Field className="w-56">
      <FieldLabel>Parcelas</FieldLabel>
      <NumberField aria-label="Quantidade" defaultValue={3} min={1} max={12} />
      <FieldDescription>De 1 a 12, sem juros.</FieldDescription>
    </Field>
  )
}

/** Desabilitado */
export function Disabled() {
  return (
    <div className="w-56">
      <NumberField aria-label="Quantidade" defaultValue={1} disabled />
    </div>
  )
}
