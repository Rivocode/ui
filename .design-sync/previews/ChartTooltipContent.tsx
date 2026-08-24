import { ChartTooltipContent, type ChartConfig } from '@rivocode/ui/chart'

const NOTAS: ChartConfig = {
  emitidas: { label: 'Emitidas' },
  pagas: { label: 'Pagas' },
}

export function ComDuasSeries() {
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

export function ComValorFormatado() {
  return (
    <ChartTooltipContent
      active
      label="Junho"
      config={{ servico: { label: 'Servico' } }}
      formatValue={(valor) => `R$ ${valor.toLocaleString('pt-BR')}`}
      payload={[{ dataKey: 'servico', value: 62000, color: 'var(--rc-chart-1)' }] as never}
    />
  )
}
