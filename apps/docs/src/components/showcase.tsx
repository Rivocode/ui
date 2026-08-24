import {
  Badge,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@rivocode/ui'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  type ChartConfig,
} from '@rivocode/ui/chart'
import { useState } from 'react'

/* ---------------------------------------------------------------------------
 * The showcase
 *
 * A list of sixty names tells the reader the library is large. It does not
 * tell them whether it is any good. This is one screen of the kind the library
 * was built for, running for real, with the theme and the density switches
 * beside it: the whole argument of the project is that those two switches
 * change everything and no component knows they exist.
 * ------------------------------------------------------------------------- */

const INVOICES = [
  { id: '4812', customer: 'Prefeitura de João Pessoa', amount: 'R$ 12.400,00', status: 'Paga' },
  { id: '4813', customer: 'Clínica São Lucas', amount: 'R$ 3.280,00', status: 'Aberta' },
  { id: '4814', customer: 'Transportes Cabo Branco', amount: 'R$ 8.750,00', status: 'Vencida' },
]

const TONE = {
  Paga: 'success',
  Aberta: 'info',
  Vencida: 'danger',
} as const

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
  { value: 'rivocode-dark', label: 'Escuro' },
  { value: 'rivocode-light', label: 'Claro' },
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

export function Showcase() {
  const [theme, setTheme] = useState<Theme>('rivocode-dark')
  const [compact, setCompact] = useState(false)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-fg-subtle">
          <span className="font-mono text-xs tracking-wide uppercase">Ao vivo</span>
          <span className="hidden sm:inline">
            as mesmas peças, os dois temas, as duas densidades
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Switcher options={THEMES} value={theme} onChange={setTheme} label="Tema" />
          <Switcher
            options={[
              { value: 'comfortable', label: 'Confortável' },
              { value: 'compact', label: 'Compacta' },
            ]}
            value={compact ? 'compact' : 'comfortable'}
            onChange={(next) => setCompact(next === 'compact')}
            label="Densidade"
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
              <Tab value="listing">Listagem</Tab>
              <Tab value="form">Formulário</Tab>
              <Tab value="chart">Gráfico</Tab>
            </TabList>

            <TabPanel value="listing">
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
                    {INVOICES.map((invoice, index) => (
                      <TableRow key={invoice.id} selected={index === 1}>
                        <TableCell className="font-mono text-sm text-fg-muted">
                          {invoice.id}
                        </TableCell>
                        <TableCell>{invoice.customer}</TableCell>
                        <TableCell>
                          <Badge tone={TONE[invoice.status as keyof typeof TONE]} size="sm">
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                  <FieldDescription>A máscara é do campo, o valor vai limpo.</FieldDescription>
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
              <ChartContainer config={CHART} className="h-64">
                <AreaChart data={MONTHS} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <ChartXAxis dataKey="month" />
                  <ChartYAxis format="currencyShort" />
                  <ChartTooltip content={<ChartTooltipContent config={CHART} />} />
                  <Area
                    dataKey="total"
                    stroke="var(--color-total)"
                    fill="var(--color-total)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>

              <p className="mt-2 text-sm text-fg-subtle">
                O eixo abrevia sozinho: R$ 246 mil, e não 246000.
              </p>
            </TabPanel>
          </Tabs>
        </div>
      </RivoProvider>
    </div>
  )
}
