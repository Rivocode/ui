import { DatePicker, Field, FieldLabel } from '@rivocode/ui'
import { useState } from 'react'

/** With label */
export function WithLabel() {
  const [dueDate, setDueDate] = useState<string | null>('2026-03-03')
  return (
    <Field className="w-64">
      <FieldLabel htmlFor="vencimento">Vencimento</FieldLabel>
      <DatePicker id="vencimento" value={dueDate} onValueChange={setDueDate} />
    </Field>
  )
}

/** With limits */
export function WithBounds() {
  return (
    <Field className="w-64">
      <FieldLabel htmlFor="entrega">Entrega</FieldLabel>
      <DatePicker id="entrega" defaultValue="" min="2026-03-05" max="2026-03-20" />
    </Field>
  )
}

/** Empty */
export function Empty() {
  return <DatePicker aria-label="Data" className="w-64" />
}
