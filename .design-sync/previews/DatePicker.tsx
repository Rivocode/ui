import { DatePicker, Field, FieldLabel } from '@rivocode/ui'

export function ComRotulo() {
  return (
    <Field className="w-64">
      <FieldLabel htmlFor="vencimento">Vencimento</FieldLabel>
      <DatePicker id="vencimento" defaultValue={new Date(2026, 2, 3)} />
    </Field>
  )
}

export function Vazio() {
  return <DatePicker className="w-64" />
}
