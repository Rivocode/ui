import { DateRangePicker, type DateRange, type IsoDateRange } from '@rivocode/ui'
import { useState } from 'react'

/** Period */
export function Period() {
  const [period, setPeriod] = useState<IsoDateRange | null>({ from: '2026-03-03', to: '2026-03-12' })
  return <DateRangePicker className="w-72" value={period} onValueChange={setPeriod} />
}

/** Empty */
export function Empty() {
  return <DateRangePicker className="w-72" />
}

/** As Date */
export function WithDate() {
  const [period, setPeriod] = useState<DateRange | null>({
    from: new Date(2026, 2, 3),
    to: new Date(2026, 2, 12),
  })
  return <DateRangePicker className="w-72" value={period ?? undefined} onValueChange={setPeriod} />
}
