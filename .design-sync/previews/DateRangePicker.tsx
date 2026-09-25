import { DateRangePicker, type IsoDateRange } from '@rivocode/ui'
import { useState } from 'react'

/** Período */
export function Period() {
  const [period, setPeriod] = useState<IsoDateRange | null>({ from: '2026-03-03', to: '2026-03-12' })
  return <DateRangePicker className="w-72" value={period} onValueChange={setPeriod} />
}

/** Vazio */
export function Empty() {
  return <DateRangePicker className="w-72" />
}
