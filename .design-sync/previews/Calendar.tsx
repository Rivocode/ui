import { Calendar } from '@rivocode/ui'
import { useState } from 'react'

/** Data única */
export function SingleDate() {
  const [date, setDate] = useState<string | null>('2026-03-03')
  return <Calendar value={date} onValueChange={setDate} />
}

/** Com limites */
export function WithBounds() {
  const [date, setDate] = useState<string | null>('2026-03-12')
  return <Calendar value={date} onValueChange={setDate} min="2026-03-05" max="2026-03-20" />
}

/** Intervalo */
export function DateRange() {
  return (
    <Calendar
      mode="range"
      selected={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 12) }}
      month={new Date(2026, 2, 1)}
    />
  )
}
