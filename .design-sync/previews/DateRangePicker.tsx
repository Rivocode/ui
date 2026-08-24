import { DateRangePicker } from '@rivocode/ui'

/** Período */
export function Period() {
  return (
    <DateRangePicker
      className="w-72"
      defaultValue={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 12) }}
    />
  )
}

/** Vazio */
export function Empty() {
  return <DateRangePicker className="w-72" />
}
