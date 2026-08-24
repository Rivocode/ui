import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rivocode/ui'
import { ChartDonut, compact, currencyShort, type ChartConfig } from '@rivocode/ui/chart'

const BY_KIND = [
  { kind: 'servico', total: 148_200 },
  { kind: 'produto', total: 62_400 },
  { kind: 'locacao', total: 24_600 },
  { kind: 'frete', total: 11_500 },
]

const NATURE: ChartConfig = {
  servico: { label: 'Serviço' },
  produto: { label: 'Produto' },
  locacao: { label: 'Locação' },
  frete: { label: 'Frete' },
}

const TOTAL = BY_KIND.reduce((sum, row) => sum + row.total, 0)

/** Num cartão de painel */
export function InADashboard() {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Por natureza</CardTitle>
        <CardDescription>Agosto de 2026.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartDonut
          data={BY_KIND}
          valueKey="total"
          nameKey="kind"
          config={NATURE}
          format={currencyShort}
          centerValue={compact(TOTAL)}
          centerLabel="no mês"
        />
      </CardContent>
    </Card>
  )
}

/** Sem a lista embaixo */
export function WithoutLegend() {
  return (
    <div className="w-64">
      <ChartDonut
        data={BY_KIND}
        valueKey="total"
        nameKey="kind"
        config={NATURE}
        legend={false}
        centerValue={compact(TOTAL)}
        centerLabel="no mês"
      />
    </div>
  )
}

/** Anel fino */
export function ThinRing() {
  return (
    <div className="w-64">
      <ChartDonut
        data={BY_KIND}
        valueKey="total"
        nameKey="kind"
        config={NATURE}
        thickness={0.16}
        format={currencyShort}
        centerValue="4"
        centerLabel="naturezas"
      />
    </div>
  )
}
