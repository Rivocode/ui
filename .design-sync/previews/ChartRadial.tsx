import { Card, CardContent } from '@rivocode/ui'
import { ChartRadial, currencyShort } from '@rivocode/ui/chart'

/** Meta do mês */
export function MonthlyGoal() {
  return (
    <div className="w-64">
      <ChartRadial value={82} centerLabel="da meta do mês" />
    </div>
  )
}

/** Com valor escrito */
export function WithOwnValue() {
  return (
    <Card className="w-64">
      <CardContent className="py-4">
        <p className="text-sm text-fg-muted">Faturado</p>
        <ChartRadial
          value={246_700}
          max={300_000}
          centerLabel={`de ${currencyShort(300_000)}`}
          label={`82% da meta de ${currencyShort(300_000)}`}
        />
      </CardContent>
    </Card>
  )
}

/** Círculo fechado */
export function FullCircle() {
  return (
    <div className="w-56">
      <ChartRadial value={64} sweep={360} centerLabel="dos clientes ativos" />
    </div>
  )
}

/** Medidor segmentado */
export function SegmentedGauge() {
  return (
    <div className="w-64">
      <ChartRadial
        value={82}
        variant="segmented"
        centerValue="82%"
        centerLabel="satisfação no mês"
        label="82% de satisfação no mês"
      />
    </div>
  )
}
