import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rivocode/ui'
import { ChartTreemap, type ChartConfig } from '@rivocode/ui/chart'

const BY_SERVICE = [
  { code: '1.07', total: 182_400 },
  { code: '17.01', total: 96_300 },
  { code: '1.03', total: 71_900 },
  { code: '7.02', total: 38_200 },
  { code: '14.01', total: 22_700 },
  { code: '10.05', total: 9_800 },
  { code: '25.01', total: 3_100 },
]

const SERVICES: ChartConfig = {
  '1.07': { label: 'Suporte técnico' },
  '17.01': { label: 'Consultoria' },
  '1.03': { label: 'Hospedagem' },
  '7.02': { label: 'Obras' },
  '14.01': { label: 'Manutenção' },
  '10.05': { label: 'Intermediação' },
  '25.01': { label: 'Funerários' },
}

/** Faturamento por serviço */
export function RevenueByService() {
  return (
    <Card className="w-[34rem]">
      <CardHeader>
        <CardTitle>Faturamento por serviço</CardTitle>
        <CardDescription>
          Itens da lista de serviço, no mês. A área é proporcional ao valor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartTreemap
          data={BY_SERVICE}
          valueKey="total"
          nameKey="code"
          config={SERVICES}
          format="currencyShort"
          label="Faturamento do mês por item da lista de serviço"
          className="h-72"
        />
      </CardContent>
    </Card>
  )
}

const STORAGE = [
  { kind: 'XML das notas', total: 38.2 },
  { kind: 'PDF das notas', total: 21.4 },
  { kind: 'Anexos', total: 6.9 },
  { kind: 'Certificados', total: 0.4 },
]

/** O rótulo que não cabe some */
export function SmallTiles() {
  return (
    <div className="w-72">
      <ChartTreemap
        data={STORAGE}
        valueKey="total"
        nameKey="kind"
        format={(gigabytes: number) => `${gigabytes.toLocaleString('pt-BR')} GB`}
        label="Armazenamento usado, por tipo de arquivo"
        className="h-48"
      />
    </div>
  )
}

/** Soma zero, com o vazio */
export function EmptyTreemap() {
  return (
    <div className="w-full max-w-lg">
      <ChartTreemap
        data={BY_SERVICE.map((row) => ({ ...row, total: 0 }))}
        valueKey="total"
        nameKey="code"
        label="Faturamento por serviço"
        empty={{
          title: 'Nenhum serviço faturado no mês',
          description: 'O mapa aparece quando a primeira nota for emitida.',
        }}
      />
    </div>
  )
}
