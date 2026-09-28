import { Badge, Button, DataTable, Input, type Column } from '@rivocode/ui'
import { currencyShort } from '@rivocode/ui/chart'
import { useState } from 'react'

type Invoice = {
  id: string
  number: string
  customer: string
  /** As a number, not as ready-made text: the formatter is what abbreviates it. */
  amount: number
  status: 'Paga' | 'Aberta'
}

const INVOICES: Invoice[] = [
  { id: '1', number: '4813', customer: 'Clinica Sao Lucas', amount: 2480, status: 'Paga' },
  { id: '2', number: '4814', customer: 'Transportes Cabo Branco', amount: 940, status: 'Aberta' },
]

const COLUMNS: Column<Invoice>[] = [
  { key: 'number', header: 'Número' },
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
    align: 'right',
    cell: (invoice) => (
      <Badge tone={invoice.status === 'Paga' ? 'success' : 'neutral'}>{invoice.status}</Badge>
    ),
  },
]

/** With data */
export function WithData() {
  return (
    <DataTable
      data={INVOICES}
      columns={COLUMNS}
      rowKey={(invoice) => invoice.id}
      empty={{ title: 'Nenhuma nota', description: 'Emita a primeira para ela aparecer.' }}
    />
  )
}

/** Loading */
export function Loading() {
  return (
    <DataTable<Invoice>
      data={undefined}
      columns={COLUMNS}
      rowKey={(invoice) => invoice.id}
      skeletonRows={3}
    />
  )
}

/** Error */
export function Error() {
  return (
    <DataTable<Invoice>
      data={undefined}
      isError
      onRetry={() => {}}
      errorTitle="Não foi possível carregar as notas"
      errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
      columns={COLUMNS}
      rowKey={(invoice) => invoice.id}
    />
  )
}

/** Empty */
export function Empty() {
  return (
    <DataTable<Invoice>
      data={[]}
      columns={COLUMNS}
      rowKey={(invoice) => invoice.id}
      empty={{
        title: 'Nenhuma nota por aqui',
        description: 'Quando você emitir a primeira, ela aparece nesta lista.',
        action: <Button size="sm">Emitir nota</Button>,
      }}
    />
  )
}

/*
 * The stories below use a larger list: with two rows, sorting shows nothing
 * and pagination does not exist.
 */
const MANY: Invoice[] = [
  ...INVOICES,
  { id: '3', number: '4815', customer: 'Padaria Aurora', amount: 1620, status: 'Paga' },
  { id: '4', number: '4816', customer: 'Ótica Central', amount: 310, status: 'Aberta' },
  { id: '5', number: '4817', customer: 'Açougue do Zé', amount: 75, status: 'Paga' },
  { id: '6', number: '4818', customer: 'Farmácia Bem Viver', amount: 5230, status: 'Paga' },
  { id: '7', number: '4819', customer: 'Auto Escola Rota', amount: 890, status: 'Aberta' },
]

/** The amount column sorts by the raw number, which `value` provides. */
const SORTABLE: Column<Invoice>[] = [
  { key: 'number', header: 'Número', sortable: true },
  { key: 'customer', header: 'Cliente', sortable: true },
  {
    key: 'amount',
    header: 'Valor',
    align: 'right',
    sortable: true,
    value: (invoice) => invoice.amount,
    cell: (invoice) => <span className="font-mono">{currencyShort(invoice.amount)}</span>,
  },
  {
    key: 'status',
    header: 'Situação',
    align: 'right',
    cell: (invoice) => (
      <Badge tone={invoice.status === 'Paga' ? 'success' : 'neutral'}>{invoice.status}</Badge>
    ),
  },
]

/** Sortable */
export function Sortable() {
  return <DataTable data={MANY} columns={SORTABLE} rowKey={(invoice) => invoice.id} />
}

/** With search */
export function Filtered() {
  const [filter, setFilter] = useState('')
  return (
    <div className="flex w-full flex-col gap-3">
      {/* The field belongs to the app, not the table: it goes wherever the
          screen needs it, and the table only receives the text. Accents and
          case do not get in the way. */}
      <Input
        aria-label="Buscar nota"
        placeholder="Buscar por cliente ou número…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="max-w-64"
      />
      <DataTable
        data={MANY}
        columns={SORTABLE}
        rowKey={(invoice) => invoice.id}
        filter={filter}
      />
    </div>
  )
}

/** With pagination */
export function Paginated() {
  return (
    <DataTable data={MANY} columns={SORTABLE} rowKey={(invoice) => invoice.id} pageSize={4} />
  )
}

/** With selection */
export function Selectable() {
  const [selected, setSelected] = useState<string[]>(['2'])
  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable
        data={MANY}
        columns={SORTABLE}
        rowKey={(invoice) => invoice.id}
        selectable
        value={selected}
        onValueChange={setSelected}
        pageSize={4}
      />
      <p className="text-sm text-fg-muted">
        {selected.length === 1 ? '1 nota selecionada' : `${selected.length} notas selecionadas`}
      </p>
    </div>
  )
}

/*
 * The middle case: many rows, and sorting and searching still working. Five
 * thousand already makes the point - with server-side pagination, this screen
 * would lose both.
 */
type Event = {
  id: string
  at: string
  level: 'info' | 'erro'
  message: string
}

const EVENTS: Event[] = Array.from({ length: 5000 }, (_, index) => ({
  id: String(index),
  at: new Date(Date.UTC(2026, 7, 26, 0, 0, index)).toISOString().slice(11, 19),
  level: index % 37 === 0 ? 'erro' : 'info',
  message: `Nota ${9000 + index} enviada para a prefeitura`,
}))

const EVENT_COLUMNS: Column<Event>[] = [
  { key: 'at', header: 'Hora', sortable: true, cell: (event) => <span className="font-mono">{event.at}</span> },
  {
    key: 'level',
    header: 'Nível',
    sortable: true,
    cell: (event) => (
      <Badge tone={event.level === 'erro' ? 'danger' : 'neutral'}>{event.level}</Badge>
    ),
  },
  { key: 'message', header: 'Evento' },
]

/** Virtualized */
export function Virtual() {
  const [filter, setFilter] = useState('')
  return (
    <div className="flex w-full flex-col gap-3">
      <Input
        aria-label="Buscar evento"
        placeholder="Buscar no log…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="max-w-64"
      />
      <DataTable
        data={EVENTS}
        columns={EVENT_COLUMNS}
        rowKey={(event) => event.id}
        filter={filter}
        caption="Log de envio de notas"
        maxHeight={360}
        virtual
      />
    </div>
  )
}

/*
 * The sum of a column, in the footer. `total` is the sibling of `cell` one
 * column up: whoever knows how to format the cell knows how to format its sum.
 */
const TOTALS: Column<Invoice>[] = [
  { key: 'number', header: 'Número', sortable: true, total: () => 'Total' },
  { key: 'customer', header: 'Cliente', sortable: true },
  {
    key: 'amount',
    header: 'Valor',
    align: 'right',
    sortable: true,
    value: (invoice) => invoice.amount,
    cell: (invoice) => <span className="font-mono">{currencyShort(invoice.amount)}</span>,
    total: (invoices) => (
      <span className="font-mono">
        {currencyShort(invoices.reduce((sum, invoice) => sum + invoice.amount, 0))}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Situação',
    align: 'right',
    cell: (invoice) => (
      <Badge tone={invoice.status === 'Paga' ? 'success' : 'neutral'}>{invoice.status}</Badge>
    ),
  },
]

/** With a totals row */
export function WithTotals() {
  return <DataTable data={MANY} columns={TOTALS} rowKey={(invoice) => invoice.id} />
}

/** Totals that follow the search */
export function TotalsWithFilter() {
  const [filter, setFilter] = useState('')
  return (
    <div className="flex w-full flex-col gap-3">
      <Input
        aria-label="Buscar nota"
        placeholder="Buscar por cliente ou número…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="max-w-64"
      />
      {/* The total counts what is left after the filter, not the page: turning
          the page does not change how much is owed. */}
      <DataTable
        data={MANY}
        columns={TOTALS}
        rowKey={(invoice) => invoice.id}
        filter={filter}
        pageSize={4}
      />
    </div>
  )
}

/** Total stuck to the frame's footer */
export function StickyTotals() {
  return (
    <DataTable data={MANY} columns={TOTALS} rowKey={(invoice) => invoice.id} maxHeight={220} />
  )
}

/** Only scrolling, without virtualizing */
export function Scrollable() {
  return (
    <DataTable
      data={MANY}
      columns={SORTABLE}
      rowKey={(invoice) => invoice.id}
      maxHeight={220}
    />
  )
}
