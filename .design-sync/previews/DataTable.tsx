import { Badge, Button, DataTable, type Column } from '@rivocode/ui'
import { currencyShort } from '@rivocode/ui/chart'

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
