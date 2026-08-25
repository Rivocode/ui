import {
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  ToggleGroup,
  Toggle,
  useToast,
  type Column,
} from '@rivocode/ui'
import { currencyShort } from '@rivocode/ui/chart'
import { Download, MoreHorizontal, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { INVOICES, STATUS_LABEL, STATUS_TONE, type Invoice, type Status } from '@/demo/data'

const FILTERS: Array<{ value: Status | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'open', label: 'Abertas' },
  { value: 'overdue', label: 'Vencidas' },
  { value: 'paid', label: 'Pagas' },
]

/** "14/09/2026" ordena errado como texto; em ISO a data vira comparável. */
const isoDate = (br: string) => br.split('/').reverse().join('-')

export function Invoices() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [period, setPeriod] = useState('30')
  const [open, setOpen] = useState<Invoice | null>(null)

  // Só o recorte de domínio fica aqui: busca, ordem e página são da tabela.
  const found = useMemo(
    () => INVOICES.filter((invoice) => status === 'all' || invoice.status === status),
    [status],
  )

  const columns: Column<Invoice>[] = [
    {
      key: 'number',
      header: 'Número',
      sortable: true,
      value: (invoice) => Number(invoice.number),
      cell: (invoice) => <span className="font-mono text-sm text-fg-muted">{invoice.number}</span>,
    },
    {
      key: 'customer',
      header: 'Cliente',
      sortable: true,
      value: (invoice) => invoice.customer,
      cell: (invoice) => (
        <span className="block">
          <span className="block truncate text-fg">{invoice.customer}</span>
          <span className="block truncate font-mono text-xs text-fg-subtle">
            {invoice.document}
          </span>
        </span>
      ),
    },
    {
      key: 'dueAt',
      header: 'Vencimento',
      hideOnMobile: true,
      sortable: true,
      value: (invoice) => isoDate(invoice.dueAt),
    },
    {
      key: 'status',
      header: 'Situação',
      cell: (invoice) => (
        <Badge tone={STATUS_TONE[invoice.status]} size="sm">
          {STATUS_LABEL[invoice.status]}
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
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (invoice) => (
        <Menu>
          <MenuTrigger
            render={
              <Button size="iconSm" variant="ghost" aria-label={`Ações da nota ${invoice.number}`} />
            }
          >
            <MoreHorizontal size={16} />
          </MenuTrigger>
          <MenuContent>
            <MenuItem onClick={() => setOpen(invoice)}>Ver detalhes</MenuItem>
            <MenuItem
              onClick={() =>
                toast.add({
                  title: `Nota ${invoice.number} enviada`,
                  description: 'O PDF foi para o e-mail do cliente.',
                })
              }
            >
              Enviar por e-mail
            </MenuItem>
            <MenuItem>Baixar PDF</MenuItem>
            <MenuSeparator />
            <MenuItem tone="danger">Cancelar nota</MenuItem>
          </MenuContent>
        </Menu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <div className="relative min-w-56 flex-1">
            <Search
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cliente, número ou CNPJ"
              aria-label="Buscar nota"
              className="pl-8"
            />
          </div>

          <Select
            value={period}
            onValueChange={(next) => setPeriod(String(next))}
            items={[
              { label: 'Últimos 30 dias', value: '30' },
              { label: 'Últimos 90 dias', value: '90' },
              { label: 'Este ano', value: 'ano' },
            ]}
          >
            <SelectTrigger aria-label="Período">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="secondary" size="icon" aria-label="Mais filtros">
            <SlidersHorizontal size={16} />
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              toast.add({ title: 'Exportação começou', description: 'Avisamos quando terminar.' })
            }
          >
            <Download size={16} />
            Exportar
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          value={[status]}
          onValueChange={(next) => setStatus((next[0] as Status | 'all') ?? 'all')}
        >
          {FILTERS.map((filter) => (
            <Toggle key={filter.value} value={filter.value}>
              {filter.label}
            </Toggle>
          ))}
        </ToggleGroup>
      </div>

      {/* Busca, ordem, página e contagem são da própria tabela: o rodapé
          "1–8 de 48" já conta o que o filtro deixou. */}
      <DataTable
        data={found}
        columns={columns}
        rowKey={(invoice) => invoice.id}
        onRowClick={setOpen}
        filter={query}
        pageSize={8}
        empty={{
          title: 'Nenhuma nota com esse filtro',
          description: 'Tente outro termo, ou volte para “Todas”.',
          action: (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery('')
                setStatus('all')
              }}
            >
              Limpar filtros
            </Button>
          ),
        }}
      />

      <Sheet side="right" open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <SheetContent className="w-[min(28rem,100vw)] p-6">
          <SheetTitle>Nota {open?.number}</SheetTitle>
          <SheetDescription>{open?.customer}</SheetDescription>

          {open && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">Situação</span>
                <Badge tone={STATUS_TONE[open.status]}>{STATUS_LABEL[open.status]}</Badge>
              </div>
              <Separator />
              {[
                ['CNPJ', open.document],
                ['Emissão', open.issuedAt],
                ['Vencimento', open.dueAt],
                ['Valor', currencyShort(open.amount)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-fg-muted">{label}</span>
                  <span className="font-mono text-sm text-fg">{value}</span>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button className="flex-1">Baixar PDF</Button>
                <Button variant="outline" className="flex-1">
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
