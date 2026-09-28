import { Field, FieldDescription, FieldLabel, TimePicker } from '@rivocode/ui'
import { useState } from 'react'

/** With label */
export function WithLabel() {
  return (
    <Field className="w-48">
      <FieldLabel htmlFor="consulta">Horário da consulta</FieldLabel>
      <TimePicker id="consulta" defaultValue="14:30" />
    </Field>
  )
}

/** Delivery window */
export function DeliveryWindow() {
  const [at, setAt] = useState('09:00')

  return (
    <Field className="w-56">
      <FieldLabel>Horário da entrega</FieldLabel>
      <TimePicker value={at} onValueChange={setAt} min="08:00" max="18:00" step={30} />
      <FieldDescription>Escolhido: {at || 'nenhum ainda'}.</FieldDescription>
    </Field>
  )
}

/** Five-minute step */
export function FineStep() {
  return (
    <Field className="w-48">
      <FieldLabel>Início da corrida</FieldLabel>
      <TimePicker defaultValue="06:45" step={5} />
    </Field>
  )
}

/** Empty */
export function Empty() {
  return <TimePicker aria-label="Horário" className="w-48" />
}

/** Disabled */
export function Disabled() {
  return <TimePicker aria-label="Horário" defaultValue="14:30" className="w-48" disabled />
}
