import { Field, FieldDescription, FieldLabel, TimeField } from '@rivocode/ui'
import { useState } from 'react'

/** Com rótulo */
export function WithLabel() {
  return (
    <Field className="w-40">
      <FieldLabel htmlFor="entrada">Entrada</FieldLabel>
      <TimeField id="entrada" defaultValue="08:00" />
    </Field>
  )
}

/** Par de pontos */
export function Shift() {
  const [start, setStart] = useState('08:00')
  const [end, setEnd] = useState('17:30')

  return (
    <div className="flex items-end gap-3">
      <Field className="w-32">
        <FieldLabel>Entrada</FieldLabel>
        <TimeField value={start} onValueChange={setStart} step={5} />
      </Field>
      <Field className="w-32">
        <FieldLabel>Saída</FieldLabel>
        <TimeField value={end} onValueChange={setEnd} step={5} min={start} />
      </Field>
    </div>
  )
}

/** Janela de entrega */
export function DeliveryWindow() {
  return (
    <Field className="w-56">
      <FieldLabel htmlFor="entrega">Horário da entrega</FieldLabel>
      <TimeField id="entrega" defaultValue="09:00" min="08:00" max="18:00" step={30} />
      <FieldDescription>Das 08:00 às 18:00, de meia em meia hora.</FieldDescription>
    </Field>
  )
}

/** Vazio */
export function Empty() {
  return <TimeField aria-label="Horário" className="w-40" />
}

/** Desabilitado */
export function Disabled() {
  return <TimeField aria-label="Horário" defaultValue="08:00" className="w-40" disabled />
}
