import { Calendar } from '@rivocode/ui'

export function DataUnica() {
  return <Calendar mode="single" selected={new Date(2026, 2, 3)} month={new Date(2026, 2, 1)} />
}

export function Intervalo() {
  return (
    <Calendar
      mode="range"
      selected={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 12) }}
      month={new Date(2026, 2, 1)}
    />
  )
}
