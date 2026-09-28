import { ChartLegendContent, type ChartConfig } from '@rivocode/ui/chart'

const SITUACOES: ChartConfig = {
  pagas: { label: 'Pagas' },
  abertas: { label: 'Abertas' },
  vencidas: { label: 'Vencidas', color: 'var(--rc-danger)' },
}

/** Três séries */
export function ThreeSeries() {
  return (
    <ChartLegendContent
      config={SITUACOES}
      payload={
        [
          { dataKey: 'pagas', value: 'pagas', color: 'var(--rc-chart-1)' },
          { dataKey: 'abertas', value: 'abertas', color: 'var(--rc-chart-2)' },
          { dataKey: 'vencidas', value: 'vencidas', color: 'var(--rc-danger)' },
        ] as never
      }
    />
  )
}
