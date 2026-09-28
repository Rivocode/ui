import { Calendar } from '@rivocode/ui'
import { useState } from 'react'

/** Single date */
export function SingleDate() {
  const [date, setDate] = useState<string | null>('2026-03-03')
  return <Calendar value={date} onValueChange={setDate} />
}

/** With limits */
export function WithBounds() {
  const [date, setDate] = useState<string | null>('2026-03-12')
  return <Calendar value={date} onValueChange={setDate} min="2026-03-05" max="2026-03-20" />
}

/** Range */
export function DateRange() {
  return (
    <Calendar
      mode="range"
      selected={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 12) }}
      month={new Date(2026, 2, 1)}
    />
  )
}

/** Without its own state */
export function Uncontrolled() {
  return <Calendar defaultValue="2026-03-03" />
}
