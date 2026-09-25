import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rivocode/ui'
import { ChartGauge, type ChartGaugeBand } from '@rivocode/ui/chart'

const DELAY: ChartGaugeBand[] = [
  { until: 5, tone: 'success', label: 'Em dia' },
  { until: 12, tone: 'warning', label: 'Atenção' },
  { until: 20, tone: 'danger', label: 'Crítico' },
]

/** Inadimplência com faixas */
export function OverdueRate() {
  return (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>Inadimplência</CardTitle>
        <CardDescription>Faturas vencidas há mais de 30 dias.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartGauge
          value={8.4}
          max={20}
          bands={DELAY}
          centerValue="8,4%"
          label="Inadimplência em 8,4%, faixa de atenção"
        />
      </CardContent>
    </Card>
  )
}

const QUOTA: ChartGaugeBand[] = [
  { until: 70, tone: 'success', label: 'Folga' },
  { until: 90, tone: 'warning', label: 'Perto do limite' },
  { until: 100, tone: 'danger', label: 'No limite' },
]

/** Três leituras, lado a lado */
export function ThreeReadings() {
  return (
    <div className="grid w-[40rem] grid-cols-3 gap-4">
      <ChartGauge value={42} bands={QUOTA} centerValue="42%" />
      <ChartGauge value={81} bands={QUOTA} centerValue="81%" />
      <ChartGauge value={97} bands={QUOTA} centerValue="97%" />
    </div>
  )
}

/** Sem faixas */
export function WithoutBands() {
  return (
    <div className="w-64">
      <ChartGauge value={640} max={1000} format="integer" centerLabel="de 1.000 notas" />
    </div>
  )
}
