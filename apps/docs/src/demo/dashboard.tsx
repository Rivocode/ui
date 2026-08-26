import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Stat,
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
  ChartAreaGradient,
  ChartDonut,
  ChartRadial,
  ChartXAxis,
  ChartYAxis,
  Sparkline,
  compact,
  currencyShort,
  areaGradient,
  useSeriesToggle,
  type ChartConfig,
} from '@rivocode/ui/chart'
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

/** A tendência que entra no slot do Stat. Invertida, desce o que subiu. */
const trendChart = (data: number[], invert = false) => (
  <Sparkline
    data={invert ? data.map((point) => -point) : data}
    variant="area"
    trend="auto"
    className="h-8 w-full"
  />
)

export function Dashboard() {
  // Clicking a name in the legend hides that series. The state lives here and
  // not in the legend because hiding it also means not drawing the area.
  const series = useSeriesToggle()
  const recent = INVOICES.slice(0, 5)
  const overdue = INVOICES.filter((invoice) => invoice.status === 'overdue').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Faturado em agosto"
          value={currencyShort(246_700)}
          delta={20}
          deltaLabel="sobre julho"
          chart={trendChart(TRENDS.billed)}
        />
        <Stat
          label="Recebido"
          value={currencyShort(198_300)}
          delta={3}
          deltaLabel="sobre julho"
          chart={trendChart(TRENDS.received)}
          hint="Só o que já caiu na conta. O que está em compensação entra no dia seguinte."
        />
        <Stat
          label="Em aberto"
          value={currencyShort(total('open'))}
          delta={-8}
          deltaLabel="sobre julho"
          chart={trendChart(TRENDS.open)}
        />
        <Stat
          label="Vencidas"
          value={String(overdue)}
          delta={50}
          deltaLabel="sobre julho"
          invert
          chart={trendChart(TRENDS.overdue, true)}
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
                <ChartAreaGradient id="faturamento" series={['billed', 'received']} />
                <CartesianGrid vertical={false} />
                <ChartXAxis dataKey="month" />
                <ChartYAxis format="compact" />
                <ChartTooltip content={<ChartTooltipContent config={BILLING} />} />
                <ChartLegend content={<ChartLegendContent config={BILLING} {...series} />} />
                {!series.isHidden('billed') && (
                  <Area
                    dataKey="billed"
                    stroke="var(--color-billed)"
                    fill={areaGradient('faturamento', 'billed')}
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                )}
                {!series.isHidden('received') && (
                  <Area
                    dataKey="received"
                    stroke="var(--color-received)"
                    fill={areaGradient('faturamento', 'received')}
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
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
              format={currencyShort}
              centerValue={compact(BY_KIND.reduce((sum, row) => sum + row.total, 0))}
              centerLabel="no mês"
              className="h-52"
            />

            <Separator className="my-4" />

            <ChartRadial
              value={246_700}
              max={300_000}
              centerValue="82%"
              centerLabel="da meta do mês"
              label="82% da meta do mês"
              className="h-36"
            />
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
