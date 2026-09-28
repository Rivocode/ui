import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rivocode/ui'
import { ChartFunnel } from '@rivocode/ui/chart'

const ONBOARDING = [
  { stage: 'Visitaram a página de preços', total: 12_480 },
  { stage: 'Criaram conta', total: 3_120 },
  { stage: 'Configuraram o certificado', total: 1_406 },
  { stage: 'Emitiram a primeira nota', total: 988 },
]

/** Funil de adesão */
export function Onboarding() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Adesão em agosto</CardTitle>
        <CardDescription>De quem chegou a quem emitiu.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartFunnel
          data={ONBOARDING}
          valueKey="total"
          nameKey="stage"
          format="integer"
          label="Funil de adesão em agosto"
        />
      </CardContent>
    </Card>
  )
}

const COLLECTION = [
  { stage: 'Boletos emitidos', total: 486_200 },
  { stage: 'Boletos vistos', total: 412_900 },
  { stage: 'Boletos pagos', total: 371_300 },
]

/** Alinhado à esquerda, em dinheiro */
export function AlignedToStart() {
  return (
    <div className="w-80">
      <ChartFunnel
        data={COLLECTION}
        valueKey="total"
        nameKey="stage"
        format="currencyShort"
        align="start"
        color="var(--rc-chart-2)"
        label="Cobrança do mês, em reais"
      />
    </div>
  )
}

/** Sem etapa nenhuma */
export function EmptyFunnel() {
  return (
    <div className="w-full max-w-md">
      <ChartFunnel
        data={[] as typeof ONBOARDING}
        valueKey="total"
        nameKey="stage"
        label="Funil de adesão"
        empty={{
          title: 'Ninguém entrou no funil ainda',
          description: 'As etapas aparecem quando a primeira visita for registrada.',
        }}
      />
    </div>
  )
}
