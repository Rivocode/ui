import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Meter,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@rivocode/ui'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartDonut,
  ChartXAxis,
  ChartYAxis,
  Sparkline,
  compact,
  currency,
  currencyShort,
  useSeriesToggle,
  type ChartConfig,
} from '@rivocode/ui/chart'
import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'
import {
  BY_KIND,
  INVOICES,
  MONTHLY,
  STATUS_LABEL,
  STATUS_TONE,
  TOP_CUSTOMERS,
  total,
} from '@/demo/data'

const BILLING: ChartConfig = {
  billed: { label: 'Faturado' },
  received: { label: 'Recebido' },
}

const NATURE: ChartConfig = {
  Serviço: { label: 'Serviço' },
  Produto: { label: 'Produto' },
  Locação: { label: 'Locação' },
  Frete: { label: 'Frete' },
}

const TOP: ChartConfig = { total: { label: 'Faturado' } }

const WEEKLY: ChartConfig = {
  issued: { label: 'Emitidas' },
  cancelled: { label: 'Canceladas' },
}

const BY_WEEK = [
  { week: 'S1', issued: 14, cancelled: 1 },
  { week: 'S2', issued: 19, cancelled: 0 },
  { week: 'S3', issued: 17, cancelled: 2 },
  { week: 'S4', issued: 22, cancelled: 1 },
]

/** Seis meses de cada indicador, só o suficiente para a linha ter forma. */
const TRENDS: Record<string, number[]> = {
  billed: [128, 155, 142, 189, 205, 247],
  received: [119, 142, 139, 170, 192, 198],
  open: [88, 96, 104, 118, 126, 133],
  overdue: [2, 3, 3, 5, 4, 6],
}

function Kpi({
  label,
  value,
  delta,
  hint,
  trend,
  invert,
}: {
  label: string
  value: string
  delta?: number
  hint?: string
  trend?: number[]
  /** Subir é ruim aqui: vencidas, custo, inadimplência. */
  invert?: boolean
}) {
  const rose = (delta ?? 0) >= 0
  // Subir nem sempre é bom: em nota vencida, a seta para cima é o alarme.
  const good = invert ? !rose : rose

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-fg-muted">{label}</p>
          {hint && (
            <Tooltip>
              <TooltipTrigger
                render={<button type="button" aria-label={`Sobre ${label}`} className="text-fg-subtle" />}
              >
                <Info size={13} />
              </TooltipTrigger>
              <TooltipContent>{hint}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <p className="mt-1 font-display text-2xl text-fg">{value}</p>

        {delta !== undefined && (
          <p
            className={`mt-1 flex items-center gap-1 text-xs ${
              good ? 'text-success-text' : 'text-danger-text'
            }`}
          >
            {rose ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(delta)}% sobre julho
          </p>
        )}

        {/* Below the number and edge to edge, not beside it: side by side the
            card had to choose between showing the trend and showing the value
            whole, and the value is what the card is for. */}
        {trend && (
          <Sparkline
            data={invert ? trend.map((point) => -point) : trend}
            variant="area"
            tone="auto"
            className="mt-3 h-8 w-full"
          />
        )}
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  // Clicking a name in the legend hides that series. The state lives here and
  // not in the legend because hiding it also means not drawing the area.
  const series = useSeriesToggle()
  const recent = INVOICES.slice(0, 5)
  const overdue = INVOICES.filter((invoice) => invoice.status === 'overdue').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Faturado em agosto"
          value={currency(246_700)}
          delta={20}
          trend={TRENDS.billed}
        />
        <Kpi
          label="Recebido"
          value={currency(198_300)}
          delta={3}
          trend={TRENDS.received}
          hint="Só o que já caiu na conta. O que está em compensação entra no dia seguinte."
        />
        <Kpi label="Em aberto" value={currency(total('open'))} delta={-8} trend={TRENDS.open} />
        <Kpi
          label="Vencidas"
          value={String(overdue)}
          delta={50}
          trend={TRENDS.overdue}
          invert
          hint="Notas com vencimento passado e sem baixa."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Faturado e recebido</CardTitle>
            <CardDescription>Últimos seis meses, em reais.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={BILLING} className="h-80">
              <AreaChart data={MONTHLY} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <ChartXAxis dataKey="month" />
                <ChartYAxis format="compact" />
                <ChartTooltip content={<ChartTooltipContent config={BILLING} />} />
                <ChartLegend content={<ChartLegendContent config={BILLING} {...series} />} />
                {!series.isHidden('billed') && (
                  <Area
                    dataKey="billed"
                    stroke="var(--color-billed)"
                    fill="var(--color-billed)"
                    fillOpacity={0.14}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                )}
                {!series.isHidden('received') && (
                  <Area
                    dataKey="received"
                    stroke="var(--color-received)"
                    fill="var(--color-received)"
                    fillOpacity={0.14}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por natureza</CardTitle>
            <CardDescription>Agosto.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartDonut
              data={BY_KIND}
              valueKey="total"
              nameKey="kind"
              config={NATURE}
              centerValue={compact(BY_KIND.reduce((sum, row) => sum + row.total, 0))}
              centerLabel="no mês"
              className="h-52"
            />

            <ul className="mt-3 space-y-1.5">
              {BY_KIND.map((row, index) => (
                <li key={row.kind} className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-sm"
                    style={{ background: `var(--rc-chart-${index + 1})` }}
                  />
                  <span className="flex-1 text-fg-muted">{row.kind}</span>
                  <span className="font-mono text-fg">{currencyShort(row.total)}</span>
                </li>
              ))}
            </ul>

            <Separator className="my-4" />

            <p className="mb-2 text-sm text-fg-muted">Meta do mês</p>
            <Meter value={82} label="R$ 246,7 mil de R$ 300 mil" showValue />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Maiores clientes</CardTitle>
            <CardDescription>Faturado no mês.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Barra deitada, e não em pé: nome de cliente é comprido, e num
                eixo vertical ele vira texto de lado ou reticência. */}
            <ChartContainer config={TOP} className="h-64">
              <BarChart data={TOP_CUSTOMERS} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <ChartXAxis type="number" format="compact" />
                <ChartYAxis type="category" dataKey="name" width={132} />
                <ChartTooltip content={<ChartTooltipContent config={TOP} />} />
                <Bar
                  dataKey="total"
                  fill="var(--color-total)"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emissão por semana</CardTitle>
            <CardDescription>Agosto, com as canceladas empilhadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={WEEKLY} className="h-64">
              <BarChart data={BY_WEEK} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <ChartXAxis dataKey="week" />
                <ChartYAxis format="integer" width={40} />
                <ChartTooltip content={<ChartTooltipContent config={WEEKLY} />} />
                <ChartLegend content={<ChartLegendContent config={WEEKLY} />} />
                <Bar
                  dataKey="issued"
                  stackId="notas"
                  fill="var(--color-issued)"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="cancelled"
                  stackId="notas"
                  fill="var(--color-cancelled)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Emitidas hoje</CardTitle>
            <CardDescription>As cinco últimas.</CardDescription>
          </div>
          <Button size="sm" variant="ghost">
            Ver todas
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm text-fg-muted">
                      {invoice.number}
                    </TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[invoice.status]} size="sm">
                        {STATUS_LABEL[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {currencyShort(invoice.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
