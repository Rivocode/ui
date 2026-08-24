import { ChartTooltipContent, currencyShort, type ChartConfig } from '@rivocode/ui/chart'

const NOTAS: ChartConfig = {
  emitidas: { label: 'Emitidas' },
  pagas: { label: 'Pagas' },
}

/** Com duas séries */
export function TwoSeries() {
  return (
    <ChartTooltipContent
      active
      label="Agosto"
      config={NOTAS}
      payload={
        [
          { dataKey: 'emitidas', value: 63, color: 'var(--rc-chart-1)' },
          { dataKey: 'pagas', value: 47, color: 'var(--rc-chart-2)' },
        ] as never
      }
    />
  )
}

/** Com valor formatado */
export function WithFormattedValue() {
  return (
    <ChartTooltipContent
      active
      label="Junho"
      config={{ servico: { label: 'Serviço' } }}
      formatValue={currencyShort}
      payload={[{ dataKey: 'servico', value: 62000, color: 'var(--rc-chart-1)' }] as never}
    />
  )
}
