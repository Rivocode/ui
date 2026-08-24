import { DateRangePicker } from '@rivocode/ui'

export function Periodo() {
  return (
    <DateRangePicker
      className="w-72"
      defaultValue={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 12) }}
    />
  )
}

export function Vazio() {
  return <DateRangePicker className="w-72" />
}
