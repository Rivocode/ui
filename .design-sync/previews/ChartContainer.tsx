import { Button } from '@rivocode/ui'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ChartAreaGradient,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Scatter,
  ScatterChart,
  areaGradient,
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

const INVOICES: ChartConfig = {
  emitidas: { label: 'Emitidas' },
  pagas: { label: 'Pagas' },
}

const UMA: ChartConfig = { emitidas: { label: 'Emitidas' } }

/** Line */
export function AsLine() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={INVOICES} className="h-64">
        <LineChart data={MESES} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <ChartXAxis dataKey="mes" />
          <ChartYAxis format="integer" width={40} />
          <ChartTooltip content={<ChartTooltipContent config={INVOICES} />} />
          <ChartLegend content={<ChartLegendContent config={INVOICES} />} />
          <Line
            dataKey="emitidas"
            stroke="var(--color-emitidas)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          <Line
            dataKey="pagas"
            stroke="var(--color-pagas)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

/** Empty, with a way out */
export function EmptyWithAction() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer
        config={UMA}
        className="h-56"
        empty={{
          title: 'Nenhuma nota em março',
          description: 'O gráfico começa a desenhar assim que a primeira for emitida.',
          action: <Button size="sm">Emitir nota</Button>,
        }}
      >
        {/* The empty `data` lives in the child, and the frame reads it from there:
            there is no need to repeat the same list on the `ChartContainer`. */}
        <LineChart data={[]}>
          <CartesianGrid vertical={false} />
          <ChartXAxis dataKey="mes" />
          <ChartYAxis format="integer" width={40} />
          <Line dataKey="emitidas" stroke="var(--color-emitidas)" isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

/** Error, saying which chart failed */
export function ErrorWithTitle() {
  return (
    <div className="w-full max-w-lg">
      {/* On a dashboard with four charts, "Não foi possível carregar o gráfico"
          four times does not say which one failed. */}
      <ChartContainer
        config={UMA}
        className="h-56"
        isError
        onRetry={() => {}}
        errorTitle="Não foi possível carregar o faturamento"
        errorMessage="A consulta expirou. Tente de novo em alguns minutos."
      >
        <LineChart data={MESES}>
          <Line dataKey="emitidas" stroke="var(--color-emitidas)" isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

/** Step line */
export function StepLine() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={UMA} className="h-56">
        <LineChart data={MESES} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <ChartXAxis dataKey="mes" />
          <ChartYAxis format="integer" width={40} />
          <ChartTooltip content={<ChartTooltipContent config={UMA} />} />
          <Line
            type="step"
            dataKey="emitidas"
            stroke="var(--color-emitidas)"
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

/** Area with gradient */
export function GradientArea() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={INVOICES} className="h-64">
        <AreaChart data={MESES} margin={{ left: 4, right: 8, top: 8 }}>
          <ChartAreaGradient id="area" series={['emitidas', 'pagas']} />
          <CartesianGrid vertical={false} />
          <ChartXAxis dataKey="mes" />
          <ChartYAxis format="integer" width={40} />
          <ChartTooltip content={<ChartTooltipContent config={INVOICES} />} />
          <ChartLegend content={<ChartLegendContent config={INVOICES} />} />
          <Area
            dataKey="emitidas"
            stroke="var(--color-emitidas)"
            fill={areaGradient('area', 'emitidas')}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            dataKey="pagas"
            stroke="var(--color-pagas)"
            fill={areaGradient('area', 'pagas')}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

/** Stacked area */
export function StackedArea() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={INVOICES} className="h-56">
        <AreaChart data={MESES} margin={{ left: 4, right: 8, top: 8 }}>
          <ChartAreaGradient id="empilhada" series={['emitidas', 'pagas']} from={0.5} to={0.1} />
          <CartesianGrid vertical={false} />
          <ChartXAxis dataKey="mes" />
          <ChartYAxis format="integer" width={40} />
          <ChartTooltip content={<ChartTooltipContent config={INVOICES} />} />
          <Area
            dataKey="pagas"
            stackId="notas"
            stroke="var(--color-pagas)"
            fill={areaGradient('empilhada', 'pagas')}
            isAnimationActive={false}
          />
          <Area
            dataKey="emitidas"
            stackId="notas"
            stroke="var(--color-emitidas)"
            fill={areaGradient('empilhada', 'emitidas')}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

/** Bar */
export function Bars() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={INVOICES} className="h-64">
        <BarChart data={MESES} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <ChartXAxis dataKey="mes" />
          <ChartYAxis format="integer" width={40} />
          <ChartTooltip content={<ChartTooltipContent config={INVOICES} />} />
          <ChartLegend content={<ChartLegendContent config={INVOICES} />} />
          <Bar dataKey="emitidas" fill="var(--color-emitidas)" radius={4} isAnimationActive={false} />
          <Bar dataKey="pagas" fill="var(--color-pagas)" radius={4} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

/** Stacked bar */
export function StackedBars() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={INVOICES} className="h-56">
        <BarChart data={MESES} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <ChartXAxis dataKey="mes" />
          <ChartYAxis format="integer" width={40} />
          <ChartTooltip content={<ChartTooltipContent config={INVOICES} />} />
          <Bar dataKey="pagas" stackId="a" fill="var(--color-pagas)" isAnimationActive={false} />
          <Bar
            dataKey="emitidas"
            stackId="a"
            fill="var(--color-emitidas)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

/** Horizontal bar, with label */
export function HorizontalBars() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={UMA} className="h-56">
        <BarChart data={MESES} layout="vertical" margin={{ left: 4, right: 32 }}>
          <CartesianGrid horizontal={false} />
          <ChartXAxis type="number" hide />
          <ChartYAxis type="category" dataKey="mes" width={40} />
          <ChartTooltip content={<ChartTooltipContent config={UMA} />} />
          <Bar
            dataKey="emitidas"
            fill="var(--color-emitidas)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            {/* The label at the tip makes the whole value axis unnecessary. */}
            <LabelList
              dataKey="emitidas"
              position="right"
              className="fill-fg-muted"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}

/** Radar */
export function AsRadar() {
  return (
    <div className="w-full max-w-sm">
      <ChartContainer config={INVOICES} className="h-64">
        <RadarChart data={MESES}>
          {/* `fill="none"` is not a detail: without it the grid renders as a solid
              gray polygon, and both series disappear behind it. */}
          <PolarGrid stroke="var(--rc-chart-grid)" fill="none" />
          <PolarAngleAxis dataKey="mes" tick={{ fill: 'var(--rc-fg-subtle)', fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent config={INVOICES} />} />
          <Radar
            dataKey="emitidas"
            stroke="var(--color-emitidas)"
            fill="var(--color-emitidas)"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Radar
            dataKey="pagas"
            stroke="var(--color-pagas)"
            fill="var(--color-pagas)"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  )
}

/** Scatter */
export function AsScatter() {
  const pontos = MESES.map((mes) => ({ x: mes.emitidas, y: mes.pagas, mes: mes.mes }))

  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={UMA} className="h-56">
        <ScatterChart margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid />
          <ChartXAxis type="number" dataKey="x" name="Emitidas" format="integer" />
          <ChartYAxis type="number" dataKey="y" name="Pagas" format="integer" width={40} />
          <ChartTooltip content={<ChartTooltipContent config={UMA} />} />
          <Scatter data={pontos} fill="var(--rc-chart-1)" isAnimationActive={false} />
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}

/** Empty without empty: the short notice */
export function EmptyWithoutProp() {
  return (
    <div className="w-full max-w-lg">
      <ChartContainer config={UMA} className="h-56">
        <LineChart data={[]}>
          <CartesianGrid vertical={false} />
          <ChartXAxis dataKey="mes" />
          <ChartYAxis format="integer" width={40} />
          <Line dataKey="emitidas" isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
