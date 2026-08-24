import {
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type ChartConfig,
} from '@rivocode/ui/chart'

const MESES = [
  { mes: 'Mar', emitidas: 38, pagas: 30 },
  { mes: 'Abr', emitidas: 45, pagas: 39 },
  { mes: 'Mai', emitidas: 41, pagas: 40 },
  { mes: 'Jun', emitidas: 52, pagas: 44 },
  { mes: 'Jul', emitidas: 58, pagas: 51 },
  { mes: 'Ago', emitidas: 63, pagas: 47 },
]

const NOTAS: ChartConfig = {
  emitidas: { label: 'Emitidas' },
  pagas: { label: 'Pagas' },
}

export function Linha() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={NOTAS} className="h-64">
        <LineChart data={MESES} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent config={NOTAS} />} />
          <ChartLegend content={<ChartLegendContent config={NOTAS} />} />
          <Line
            dataKey="emitidas"
            stroke="var(--color-emitidas)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="pagas"
            stroke="var(--color-pagas)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

export function Barra() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={NOTAS} className="h-64">
        <BarChart data={MESES} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent config={NOTAS} />} />
          <Bar dataKey="emitidas" fill="var(--color-emitidas)" radius={4} isAnimationActive={false} />
          <Bar dataKey="pagas" fill="var(--color-pagas)" radius={4} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
