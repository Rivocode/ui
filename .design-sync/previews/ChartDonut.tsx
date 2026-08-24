import { ChartDonut, compact } from '@rivocode/ui/chart'

const BY_KIND = [
  { kind: 'Serviço', total: 148_200 },
  { kind: 'Produto', total: 62_400 },
  { kind: 'Locação', total: 24_600 },
  { kind: 'Frete', total: 11_500 },
]

const TOTAL = BY_KIND.reduce((sum, row) => sum + row.total, 0)

/** Com o total no meio */
export function WithTotal() {
  return (
    <div className="w-72">
      <ChartDonut
        data={BY_KIND}
        valueKey="total"
        nameKey="kind"
        centerValue={compact(TOTAL)}
        centerLabel="no mês"
      />
    </div>
  )
}

/** Anel grosso, sem miolo */
export function ThickRing() {
  return (
    <div className="w-72">
      <ChartDonut data={BY_KIND} valueKey="total" nameKey="kind" thickness={0.7} />
    </div>
  )
}
