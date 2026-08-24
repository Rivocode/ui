import { Calendar } from '@rivocode/ui'

/** Data única */
export function SingleDate() {
  return <Calendar mode="single" selected={new Date(2026, 2, 3)} month={new Date(2026, 2, 1)} />
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
