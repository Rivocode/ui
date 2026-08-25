import { Badge, Button, DataTable, Input, type Column } from '@rivocode/ui'
import { currencyShort } from '@rivocode/ui/chart'
import { useState } from 'react'

type Invoice = {
  id: string
  number: string
  customer: string
  /** Em número, e não em texto pronto: é o formatador que abrevia. */
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

/** Com dados */
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

/** Carregando */
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

/** Erro */
export function Error() {
  return (
    <DataTable<Invoice>
      data={undefined}
      isError
      onRetry={() => {}}
      errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
      columns={COLUMNS}
      rowKey={(invoice) => invoice.id}
    />
  )
}

/** Vazio */
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
 * As historias abaixo usam uma lista maior: com duas linhas, ordenar nao
 * mostra nada e paginar nao existe.
 */
const MANY: Invoice[] = [
  ...INVOICES,
  { id: '3', number: '4815', customer: 'Padaria Aurora', amount: 1620, status: 'Paga' },
  { id: '4', number: '4816', customer: 'Ótica Central', amount: 310, status: 'Aberta' },
  { id: '5', number: '4817', customer: 'Açougue do Zé', amount: 75, status: 'Paga' },
  { id: '6', number: '4818', customer: 'Farmácia Bem Viver', amount: 5230, status: 'Paga' },
  { id: '7', number: '4819', customer: 'Auto Escola Rota', amount: 890, status: 'Aberta' },
]

/** A coluna de valor ordena pelo numero cru, que `value` entrega. */
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

/** Ordenável */
export function Sortable() {
  return <DataTable data={MANY} columns={SORTABLE} rowKey={(invoice) => invoice.id} />
}

/** Com busca */
export function Filtered() {
  const [filter, setFilter] = useState('')
  return (
    <div className="flex w-full flex-col gap-3">
      {/* O campo é do app, não da tabela: ele vai onde a tela pedir, e a
          tabela só recebe o texto. Acento e caixa não atrapalham. */}
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

/** Com paginação */
export function Paginated() {
  return (
    <DataTable data={MANY} columns={SORTABLE} rowKey={(invoice) => invoice.id} pageSize={4} />
  )
}

/** Com seleção */
export function Selectable() {
  const [selected, setSelected] = useState<string[]>(['2'])
  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable
        data={MANY}
        columns={SORTABLE}
        rowKey={(invoice) => invoice.id}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        pageSize={4}
      />
      <p className="text-sm text-fg-muted">
        {selected.length === 1 ? '1 nota selecionada' : `${selected.length} notas selecionadas`}
      </p>
    </div>
  )
}
