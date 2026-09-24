import {
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  FilterBar,
  PageHeader,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  currencyShort,
  useToast,
  type AppliedFilter,
  type Column,
} from '@rivocode/ui'
import { Archive, Download, Plus, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'

type Customer = {
  id: string
  name: string
  document: string
  city: string
  billed: number
  status: 'active' | 'late' | 'paused'
}

const STATUS: Record<Customer['status'], { label: string; tone: 'success' | 'danger' | 'neutral' }> = {
  active: { label: 'Em dia', tone: 'success' },
  late: { label: 'Com atraso', tone: 'danger' },
  paused: { label: 'Pausado', tone: 'neutral' },
}

const STATUS_ITEMS = [
  { label: 'Todas as situações', value: 'all' },
  { label: 'Em dia', value: 'active' },
  { label: 'Com atraso', value: 'late' },
  { label: 'Pausado', value: 'paused' },
]

const CUSTOMERS: Customer[] = [
  { id: '1', name: 'Clínica São Lucas', document: '12.345.678/0001-95', city: 'João Pessoa', billed: 32_800, status: 'active' },
  { id: '2', name: 'Padaria Aurora', document: '23.456.789/0001-10', city: 'Campina Grande', billed: 8_900, status: 'active' },
  { id: '3', name: 'Oficina Norte', document: '34.567.890/0001-40', city: 'Recife', billed: 124_000, status: 'late' },
  { id: '4', name: 'Transportes Cabo Branco', document: '45.678.901/0001-02', city: 'João Pessoa', billed: 59_600, status: 'active' },
  { id: '5', name: 'Escola Mar Azul', document: '56.789.012/0001-71', city: 'Natal', billed: 21_500, status: 'paused' },
  { id: '6', name: 'Farmácia Boa Hora', document: '67.890.123/0001-38', city: 'Recife', billed: 17_300, status: 'late' },
  { id: '7', name: 'Hotel Tambaú', document: '78.901.234/0001-55', city: 'João Pessoa', billed: 88_100, status: 'active' },
  { id: '8', name: 'Academia Ponta Verde', document: '89.012.345/0001-06', city: 'Maceió', billed: 12_700, status: 'active' },
]

const COLUMNS: Column<Customer>[] = [
  { key: 'name', header: 'Cliente', sortable: true },
  {
    key: 'document',
    header: 'CNPJ',
    hideOnMobile: true,
    cell: (customer) => <span className="font-mono">{customer.document}</span>,
  },
  { key: 'city', header: 'Cidade', hideOnMobile: true, sortable: true },
  {
    key: 'billed',
    header: 'Faturado no ano',
    align: 'right',
    sortable: true,
    cell: (customer) => <span className="font-mono">{currencyShort(customer.billed)}</span>,
    total: (rows) => (
      <span className="font-mono">{currencyShort(rows.reduce((sum, row) => sum + row.billed, 0))}</span>
    ),
  },
  {
    key: 'status',
    header: 'Situação',
    value: (customer) => STATUS[customer.status].label,
    cell: (customer) => (
      <Badge tone={STATUS[customer.status].tone} size="sm">
        {STATUS[customer.status].label}
      </Badge>
    ),
  },
]

export default function CustomersPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<string[]>([])

  const rows = useMemo(
    () => CUSTOMERS.filter((customer) => status === 'all' || customer.status === status),
    [status],
  )

  const filters: AppliedFilter[] = [
    ...(search ? [{ id: 'search', label: 'Busca', value: search }] : []),
    ...(status !== 'all'
      ? [{ id: 'status', label: 'Situação', value: STATUS[status as Customer['status']].label }]
      : []),
  ]

  const clear = () => {
    setSearch('')
    setStatus('all')
  }

  return (
    <div className="w-full space-y-4 bg-bg p-4 sm:p-6">
      <PageHeader
        title="Clientes"
        description="Quem recebe as suas notas, com o que já foi faturado no ano."
        actions={
          <Button>
            <Plus size={16} aria-hidden="true" />
            Novo cliente
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            placeholder="Nome, CNPJ ou cidade"
            aria-label="Buscar cliente"
          />
          <Select value={status} onValueChange={(value) => setStatus(String(value))} items={STATUS_ITEMS}>
            <SelectTrigger className="w-full" aria-label="Situação">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <FilterBar
        filters={filters}
        onRemove={(filter) => (filter.id === 'search' ? setSearch('') : setStatus('all'))}
        onClear={clear}
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3 shadow-2">
          <p className="text-sm text-fg">
            {selected.length === 1 ? '1 cliente selecionado' : `${selected.length} clientes selecionados`}
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Desmarcar
            </Button>
            <Button variant="secondary" size="sm">
              <Download size={14} aria-hidden="true" />
              Exportar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                toast.add({
                  title: selected.length === 1 ? 'Cliente arquivado' : `${selected.length} clientes arquivados`,
                  description: 'Eles saem da lista, e as notas continuam guardadas.',
                })
                setSelected([])
              }}
            >
              <Archive size={14} aria-hidden="true" />
              Arquivar
            </Button>
          </div>
        </div>
      )}

      <DataTable
        data={rows}
        columns={COLUMNS}
        rowKey={(customer) => customer.id}
        caption="Clientes"
        filter={search}
        pageSize={6}
        selectable
        value={selected}
        onValueChange={setSelected}
        noResultsMessage="Nenhum cliente com esse nome, CNPJ ou cidade."
        empty={{
          icon: <SearchX aria-hidden="true" />,
          title: 'Nenhum cliente nesta situação',
          description: 'Troque a situação no filtro, ou limpe os filtros para ver todos.',
          action: (
            <Button variant="secondary" size="sm" onClick={clear}>
              Limpar filtros
            </Button>
          ),
        }}
      />
    </div>
  )
}
