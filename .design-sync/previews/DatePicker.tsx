import { DatePicker, Field, FieldLabel } from '@rivocode/ui'

/** Com rótulo */
export function WithLabel() {
  return (
    <Field className="w-64">
      <FieldLabel htmlFor="vencimento">Vencimento</FieldLabel>
      <DatePicker id="vencimento" defaultValue={new Date(2026, 2, 3)} />
    </Field>
  )
}

/** Vazio */
export function Empty() {
  return <DatePicker className="w-64" />
}
