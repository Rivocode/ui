import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Toggle,
  ToggleGroup,
  currencyShort,
  type Column,
} from '@rivocode/ui'
import { Plus, SearchX } from 'lucide-react'
import { useState } from 'react'

type Invoice = { id: string; customer: string; amount: number; paid: boolean }

type Situation = 'first-run' | 'filtered' | 'error' | 'loading' | 'data'

const SITUATIONS: Array<{ value: Situation; label: string }> = [
  { value: 'first-run', label: 'Primeira vez' },
  { value: 'filtered', label: 'Filtro sem resultado' },
  { value: 'error', label: 'Erro' },
  { value: 'loading', label: 'Carregando' },
  { value: 'data', label: 'Com dados' },
]

const INVOICES: Invoice[] = [
  { id: '4849', customer: 'Clínica São Lucas', amount: 3_280, paid: false },
  { id: '4848', customer: 'Padaria Aurora', amount: 890, paid: true },
  { id: '4847', customer: 'Oficina Norte', amount: 12_400, paid: true },
]

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
    key: 'paid',
    header: 'Situação',
    hideOnMobile: true,
    cell: (invoice) => (
      <Badge tone={invoice.paid ? 'success' : 'info'} size="sm">
        {invoice.paid ? 'Paga' : 'Em aberto'}
      </Badge>
    ),
  },
]

function Illustration() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-auto text-fg-subtle" aria-hidden="true">
      <rect x="20" y="10" width="80" height="60" rx="8" className="fill-accent-subtle" />
      <path
        d="M36 32h48M36 44h32M36 56h20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function InvoiceStatesPage() {
  const [situation, setSituation] = useState<Situation>('first-run')

  return (
    <div className="w-full space-y-4 bg-bg p-4 sm:p-6">
      <PageHeader
        title="Notas fiscais"
        description="Toda listagem tem quatro finais: dados, carregando, erro e vazio."
        actions={
          <Button>
            <Plus size={16} aria-hidden="true" />
            Emitir nota
          </Button>
        }
      />

      <ToggleGroup
        aria-label="Ver a listagem no estado"
        value={[situation]}
        onValueChange={(value) => {
          const next = value[0] as Situation | undefined
          if (next) setSituation(next)
        }}
        className="flex-wrap"
      >
        {SITUATIONS.map((option) => (
          <Toggle key={option.value} value={option.value}>
            {option.label}
          </Toggle>
        ))}
      </ToggleGroup>

      {situation === 'first-run' ? (
        <Card>
          <EmptyState
            illustration={<Illustration />}
            title="Nenhuma nota por aqui"
            description="Quando você emitir a primeira, ela aparece nesta lista, com a situação de pagamento."
            action={
              <Button size="sm">
                <Plus size={14} aria-hidden="true" />
                Emitir a primeira nota
              </Button>
            }
          />
        </Card>
      ) : (
        <DataTable
          data={situation === 'data' ? INVOICES : situation === 'filtered' ? [] : undefined}
          isLoading={situation === 'loading'}
          isError={situation === 'error'}
          onRetry={() => setSituation('loading')}
          errorTitle="Não foi possível carregar as notas"
          errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
          labels={{ retry: "Tentar de novo" }}
          columns={COLUMNS}
          rowKey={(invoice) => invoice.id}
          caption="Notas fiscais de agosto"
          skeletonRows={3}
          empty={{
            icon: <SearchX aria-hidden="true" />,
            title: 'Nenhuma nota vencida em agosto',
            description: 'O filtro está em "vencidas" e "agosto". Mude o período para ver os outros meses.',
            action: (
              <Button variant="secondary" size="sm" onClick={() => setSituation('data')}>
                Limpar filtros
              </Button>
            ),
          }}
        />
      )}
    </div>
  )
}
