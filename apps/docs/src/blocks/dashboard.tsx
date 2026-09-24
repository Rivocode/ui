import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  PageHeader,
  Stat,
  type Column,
} from '@rivocode/ui'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ChartAreaGradient,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  Sparkline,
  areaGradient,
  currencyShort,
  type ChartConfig,
} from '@rivocode/ui/chart'
import { Download, Plus } from 'lucide-react'

type Invoice = {
  id: string
  customer: string
  amount: number
  status: 'paid' | 'open' | 'overdue'
}

const STATUS: Record<Invoice['status'], { label: string; tone: 'success' | 'info' | 'danger' }> = {
  paid: { label: 'Paga', tone: 'success' },
  open: { label: 'Em aberto', tone: 'info' },
  overdue: { label: 'Vencida', tone: 'danger' },
}

const MONTHS = [
  { month: 'mar', billed: 128_000, received: 119_000 },
  { month: 'abr', billed: 155_000, received: 142_000 },
  { month: 'mai', billed: 142_000, received: 139_000 },
  { month: 'jun', billed: 189_000, received: 170_000 },
  { month: 'jul', billed: 205_000, received: 192_000 },
  { month: 'ago', billed: 246_700, received: 198_300 },
]

const RECENT: Invoice[] = [
  { id: '4849', customer: 'Clínica São Lucas', amount: 3_280, status: 'open' },
  { id: '4848', customer: 'Padaria Aurora', amount: 890, status: 'paid' },
  { id: '4847', customer: 'Oficina Norte', amount: 12_400, status: 'overdue' },
  { id: '4846', customer: 'Transportes Cabo Branco', amount: 5_960, status: 'paid' },
  { id: '4845', customer: 'Escola Mar Azul', amount: 2_150, status: 'paid' },
]

const BILLING: ChartConfig = {
  billed: { label: 'Faturado' },
  received: { label: 'Recebido' },
}

const COLUMNS: Column<Invoice>[] = [
  { key: 'id', header: 'Nota', cell: (invoice) => <span className="font-mono">{invoice.id}</span> },
  { key: 'customer', header: 'Cliente' },
  {
    key: 'amount',
    header: 'Valor',
    align: 'right',
    cell: (invoice) => <span className="font-mono">{currencyShort(invoice.amount)}</span>,
  },
  {
    key: 'status',
    header: 'Situação',
    hideOnMobile: true,
    cell: (invoice) => (
      <Badge tone={STATUS[invoice.status].tone} size="sm">
        {STATUS[invoice.status].label}
      </Badge>
    ),
  },
]

const trend = (data: number[]) => (
  <Sparkline data={data} variant="area" trend="auto" className="h-8 w-full" />
)

export default function DashboardPage() {
  return (
    <div className="w-full space-y-6 bg-bg p-4 sm:p-6">
      <PageHeader
        title="Painel"
        description="Agosto de 2026, até hoje."
        actions={
          <>
            <Button variant="secondary">
              <Download size={16} aria-hidden="true" />
              Exportar
            </Button>
            <Button>
              <Plus size={16} aria-hidden="true" />
              Emitir nota
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        <Stat
          label="Faturado em agosto"
          value={currencyShort(246_700)}
          delta={20}
          deltaLabel="sobre julho"
          chart={trend([128, 155, 142, 189, 205, 247])}
        />
        <Stat
          label="Recebido"
          value={currencyShort(198_300)}
          delta={3}
          deltaLabel="sobre julho"
          hint="Só o que já caiu na conta."
          chart={trend([119, 142, 139, 170, 192, 198])}
        />
        <Stat
          label="Em aberto"
          value={currencyShort(133_000)}
          delta={-8}
          deltaLabel="sobre julho"
          chart={trend([88, 96, 104, 118, 126, 133])}
        />
        <Stat
          label="Vencidas"
          value="6"
          delta={50}
          deltaLabel="sobre julho"
          invert
          hint="Notas com vencimento passado e sem baixa."
          chart={trend([-2, -3, -3, -5, -4, -6])}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5 [&>*]:min-w-0">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Faturado e recebido</CardTitle>
            <CardDescription>Últimos seis meses, em reais.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={BILLING} className="h-72">
              <AreaChart data={MONTHS} margin={{ left: 4, right: 8, top: 8 }}>
                <ChartAreaGradient id="painel-faturamento" series={['billed', 'received']} />
                <CartesianGrid vertical={false} />
                <ChartXAxis dataKey="month" />
                <ChartYAxis format="compact" />
                <ChartTooltip content={<ChartTooltipContent config={BILLING} />} />
                <ChartLegend content={<ChartLegendContent config={BILLING} />} />
                <Area
                  dataKey="billed"
                  stroke="var(--color-billed)"
                  fill={areaGradient('painel-faturamento', 'billed')}
                  strokeWidth={2}
                />
                <Area
                  dataKey="received"
                  stroke="var(--color-received)"
                  fill={areaGradient('painel-faturamento', 'received')}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Últimas notas</CardTitle>
            <CardDescription>As cinco mais recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={RECENT}
              columns={COLUMNS}
              rowKey={(invoice) => invoice.id}
              caption="As cinco notas mais recentes"
              empty={{
                title: 'Nenhuma nota neste mês',
                description: 'Quando você emitir a primeira, ela aparece aqui.',
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
