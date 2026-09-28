import {
  Badge,
  Button,
  DataTable,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Kbd,
  MaskedInput,
  RivoProvider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type Column,
} from '@rivocode/ui'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartAreaGradient,
  ChartXAxis,
  ChartYAxis,
  areaGradient,
  currencyShort,
  type ChartConfig,
} from '@rivocode/ui/chart'
import { useState } from 'react'

/* ---------------------------------------------------------------------------
 * The showcase
 *
 * A list of sixty names tells the reader the library is big. It does not say
 * whether it is any good. This is a screen of the kind the library was made
 * for, running for real, with the theme and density switches beside it: the
 * project's whole argument is that those two switches change everything and
 * no component knows they exist.
 *
 * The screen content inside the provider stays in Portuguese on purpose: it is
 * the Brazilian app the library is built for.
 * ------------------------------------------------------------------------- */

type ShowcaseInvoice = {
  id: string
  customer: string
  /* Raw number: currencyShort abbreviates, never a hand. */
  amount: number
  status: 'Paga' | 'Aberta' | 'Vencida'
}

const INVOICES: ShowcaseInvoice[] = [
  { id: '4812', customer: 'Prefeitura de João Pessoa', amount: 12_400, status: 'Paga' },
  { id: '4813', customer: 'Clínica São Lucas', amount: 3_300, status: 'Aberta' },
  { id: '4814', customer: 'Transportes Cabo Branco', amount: 8_800, status: 'Vencida' },
]

const TONE = {
  Paga: 'success',
  Aberta: 'info',
  Vencida: 'danger',
} as const

/* Sorting and selecting above the fold: the showcase table shows what
 * DataTable does on its own, not a static <table> pretending. */
const SHOWCASE_COLUMNS: Column<ShowcaseInvoice>[] = [
  {
    key: 'id',
    header: 'Número',
    cell: (invoice) => <span className="font-mono text-sm text-fg-muted">{invoice.id}</span>,
  },
  { key: 'customer', header: 'Cliente', sortable: true, value: (invoice) => invoice.customer },
  {
    key: 'status',
    header: 'Situação',
    cell: (invoice) => (
      <Badge tone={TONE[invoice.status]} size="sm">
        {invoice.status}
      </Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Valor',
    align: 'right',
    sortable: true,
    value: (invoice) => invoice.amount,
    cell: (invoice) => <span className="font-mono">{currencyShort(invoice.amount)}</span>,
  },
]

const MONTHS = [
  { month: 'Mar', total: 128_000 },
  { month: 'Abr', total: 154_000 },
  { month: 'Mai', total: 142_000 },
  { month: 'Jun', total: 188_000 },
  { month: 'Jul', total: 205_000 },
  { month: 'Ago', total: 246_000 },
]

const CHART: ChartConfig = { total: { label: 'Faturado' } }

const THEMES = [
  { value: 'rivocode-dark', label: 'Dark' },
  { value: 'rivocode-light', label: 'Light' },
] as const

type Theme = (typeof THEMES)[number]['value']

function Switcher<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (next: T) => void
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-0.5 rounded-md border border-border bg-bg p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`inline-flex h-7 items-center rounded-sm px-2.5 font-sans text-sm transition-colors ${
            value === option.value
              ? 'bg-surface-raised text-fg'
              : 'text-fg-subtle hover:text-fg'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function BillingChart() {
  return (
    <ChartContainer config={CHART} className="h-64">
      <AreaChart data={MONTHS} margin={{ left: 4, right: 8, top: 8 }}>
        <ChartAreaGradient id="vitrine" series={['total']} />
        <CartesianGrid vertical={false} />
        <ChartXAxis dataKey="month" />
        <ChartYAxis format="currencyShort" />
        <ChartTooltip content={<ChartTooltipContent config={CHART} />} />
        <Area
          dataKey="total"
          stroke="var(--color-total)"
          fill={areaGradient('vitrine', 'total')}
          strokeWidth={2}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function Showcase() {
  const [theme, setTheme] = useState<Theme>('rivocode-dark')
  const [compact, setCompact] = useState(false)
  // One row already checked, so the selection column introduces itself.
  const [selected, setSelected] = useState<string[]>(['4813'])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-fg-subtle">
          <span className="font-mono text-xs tracking-wide uppercase">Live</span>
          <span className="hidden sm:inline">
            the same pieces, both themes, both densities
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Switcher options={THEMES} value={theme} onChange={setTheme} label="Theme" />
          <Switcher
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
            value={compact ? 'compact' : 'comfortable'}
            onChange={(next) => setCompact(next === 'compact')}
            label="Density"
          />
        </div>
      </header>

      <RivoProvider
        scope="local"
        theme={theme}
        density={compact ? 'compact' : 'comfortable'}
      >
        <div className="bg-bg p-4 sm:p-6">
          <Tabs defaultValue="listing">
            <TabList>
              <Tab value="listing">Listing</Tab>
              <Tab value="form">Form</Tab>
              <Tab value="chart">Chart</Tab>
            </TabList>

            <TabPanel value="listing">
              <div className="overflow-x-auto">
                <DataTable
                  data={INVOICES}
                  columns={SHOWCASE_COLUMNS}
                  rowKey={(invoice) => invoice.id}
                  selectable
                  value={selected}
                  onValueChange={setSelected}
                />
              </div>

              <p className="mt-4 flex items-center gap-2 text-sm text-fg-subtle">
                Buscar em qualquer tela <Kbd size="sm" keys="mod+k" />
              </p>
            </TabPanel>

            <TabPanel value="form">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Cliente</FieldLabel>
                  <Input placeholder="Quem recebe a nota" defaultValue="Clínica São Lucas" />
                </Field>

                <Field>
                  <FieldLabel>CNPJ</FieldLabel>
                  <MaskedInput mask="cnpj" defaultValue="12345678000190" />
                  <FieldDescription>The mask belongs to the field, the value goes out clean.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Valor</FieldLabel>
                  <MaskedInput mask="moeda" defaultValue="328000" />
                </Field>

                <Field>
                  <FieldLabel>Vencimento</FieldLabel>
                  <Select
                    defaultValue="30"
                    items={[
                      { label: 'Em 15 dias', value: '15' },
                      { label: 'Em 30 dias', value: '30' },
                      { label: 'Em 60 dias', value: '60' },
                    ]}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Em 15 dias</SelectItem>
                      <SelectItem value="30">Em 30 dias</SelectItem>
                      <SelectItem value="60">Em 60 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button>Emitir nota</Button>
                <Button variant="outline">Salvar rascunho</Button>
              </div>
            </TabPanel>

            <TabPanel value="chart">
              <BillingChart />

              <p className="mt-2 text-sm text-fg-subtle">
                The axis abbreviates on its own: R$ 246K, not 246000.
              </p>
            </TabPanel>
          </Tabs>
        </div>
      </RivoProvider>
    </div>
  )
}
