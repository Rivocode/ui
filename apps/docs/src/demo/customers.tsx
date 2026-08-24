import {
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ContextMenu,
  ContextMenuTrigger,
  DateRangePicker,
  EmptyState,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  MenuContent,
  MenuItem,
  MenuSeparator,
  Meter,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  ScrollArea,
  Separator,
  Tree,
  useToast,
  type DateRange,
  type TreeNode,
} from '@rivocode/ui'
import { currencyShort } from '@rivocode/ui/chart'
import { Grid2x2, List, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

/* ---------------------------------------------------------------------------
 * Customers
 *
 * The screen the demo was missing. It exists to carry the pieces a dashboard
 * and a listing never reach: a tree for the segments, a combobox for search
 * with free text, a date range, a context menu on the row, a popover with the
 * credit limit, and an empty state that says what to do next.
 * ------------------------------------------------------------------------- */

type Customer = {
  id: string
  name: string
  document: string
  city: string
  segment: string
  billed: number
  limit: number
  active: boolean
}

const CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Prefeitura de João Pessoa',
    document: '08.778.326/0001-56',
    city: 'João Pessoa, PB',
    segment: 'publico',
    billed: 48_200,
    limit: 120_000,
    active: true,
  },
  {
    id: '2',
    name: 'Construtora Manaíra',
    document: '45.678.901/0001-23',
    city: 'João Pessoa, PB',
    segment: 'industria',
    billed: 36_900,
    limit: 60_000,
    active: true,
  },
  {
    id: '3',
    name: 'Supermercado Tambaú',
    document: '34.567.890/0001-12',
    city: 'Cabedelo, PB',
    segment: 'varejo',
    billed: 28_400,
    limit: 40_000,
    active: true,
  },
  {
    id: '4',
    name: 'Clínica São Lucas',
    document: '12.345.678/0001-90',
    city: 'Campina Grande, PB',
    segment: 'saude',
    billed: 21_700,
    limit: 30_000,
    active: true,
  },
  {
    id: '5',
    name: 'Hotel Ponta do Seixas',
    document: '89.012.345/0001-67',
    city: 'João Pessoa, PB',
    segment: 'varejo',
    billed: 17_300,
    limit: 25_000,
    active: false,
  },
  {
    id: '6',
    name: 'Laboratório Epitácio',
    document: '01.234.567/0001-89',
    city: 'João Pessoa, PB',
    segment: 'saude',
    billed: 9_400,
    limit: 20_000,
    active: true,
  },
]

const SEGMENTS: TreeNode[] = [
  {
    id: 'todos',
    label: 'Todos os segmentos',
    children: [
      { id: 'publico', label: 'Setor público' },
      { id: 'industria', label: 'Indústria' },
      {
        id: 'servicos',
        label: 'Serviços',
        children: [
          { id: 'saude', label: 'Saúde' },
          { id: 'varejo', label: 'Varejo' },
        ],
      },
    ],
  },
]

const SEARCHABLE = CUSTOMERS.map((customer) => ({ value: customer.id, label: customer.name }))

/** Na árvore quem vale é a folha, então o estado é a lista de folhas. */
const LEAVES = ['publico', 'industria', 'saude', 'varejo']

const initials = (name: string) =>
  name
    .split(' ')
    .filter((word) => word.length > 3)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

function CustomerRow({ customer, onAction }: { customer: Customer; onAction: () => void }) {
  const used = Math.round((customer.billed / customer.limit) * 100)

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Item>
          <ItemMedia>
            <Avatar size="sm" fallback={initials(customer.name)} />
          </ItemMedia>

          <ItemContent>
            <ItemTitle>
              {customer.name}
              {!customer.active && (
                <Badge tone="neutral" size="sm" className="ml-2">
                  Inativo
                </Badge>
              )}
            </ItemTitle>
            <ItemDescription>
              {customer.document} · {customer.city}
            </ItemDescription>
          </ItemContent>

          <ItemActions>
            <Popover>
              <PopoverTrigger render={<Button size="sm" variant="ghost" />}>
                {currencyShort(customer.billed)}
              </PopoverTrigger>
              <PopoverContent>
                <PopoverTitle>Limite de crédito</PopoverTitle>
                <PopoverDescription>
                  Faturado no mês contra o limite aprovado para este cliente.
                </PopoverDescription>
                <div className="mt-4">
                  <Meter
                    value={used}
                    label={`${currencyShort(customer.billed)} de ${currencyShort(customer.limit)}`}
                    showValue
                  />
                </div>
              </PopoverContent>
            </Popover>
          </ItemActions>
        </Item>
      </ContextMenuTrigger>

      <MenuContent>
        <MenuItem onClick={onAction}>Ver notas do cliente</MenuItem>
        <MenuItem onClick={onAction}>Editar cadastro</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" onClick={onAction}>
          Desativar
        </MenuItem>
      </MenuContent>
    </ContextMenu>
  )
}

function CustomerCard({ customer }: { customer: Customer }) {
  const used = Math.round((customer.billed / customer.limit) * 100)

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <Avatar fallback={initials(customer.name)} />
          <div className="min-w-0">
            <p className="truncate text-fg">{customer.name}</p>
            <p className="truncate font-mono text-xs text-fg-subtle">{customer.document}</p>
          </div>
        </div>

        <Separator className="my-3" />

        <p className="text-sm text-fg-muted">{customer.city}</p>
        <p className="mt-1 font-display text-xl text-fg">{currencyShort(customer.billed)}</p>

        <div className="mt-3">
          <Meter value={used} label="do limite" showValue />
        </div>
      </CardContent>
    </Card>
  )
}

export function Customers({ onOpenInvoices }: { onOpenInvoices: () => void }) {
  const toast = useToast()
  const [segment, setSegment] = useState<string[]>(LEAVES)
  const [picked, setPicked] = useState<string | null>(null)
  const [range, setRange] = useState<DateRange | undefined>()
  const [view, setView] = useState<'list' | 'grid'>('list')
  // Controlada e já aberta: uma árvore que abre fechada esconde justamente o
  // que a coluna existe para mostrar.
  const [expanded, setExpanded] = useState<string[]>(['todos', 'servicos'])

  const found = useMemo(
    () =>
      CUSTOMERS.filter((customer) => {
        if (picked && customer.id !== picked) return false
        // Marcar "Serviços" marca Saúde e Varejo: a árvore já resolve isso, e
        // aqui só sobra perguntar se a folha do cliente está na lista.
        return segment.includes(customer.segment)
      }),
    [segment, picked],
  )

  const clear = () => {
    setSegment(LEAVES)
    setPicked(null)
    setRange(undefined)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <Card className="max-lg:order-2">
        <CardHeader>
          <CardTitle>Segmentos</CardTitle>
          <CardDescription>Escolher um ramo leva o que está dentro dele.</CardDescription>
        </CardHeader>
        <CardContent className="px-2">
          <ScrollArea className="max-h-72">
            <Tree
              items={SEGMENTS}
              selected={segment}
              onSelectedChange={setSegment}
              expanded={expanded}
              onExpandedChange={setExpanded}
              multiple
            />
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <Combobox
              items={SEARCHABLE}
              value={picked}
              onValueChange={(next) => setPicked(next ? String(next) : null)}
            >
              <div className="min-w-56 flex-1">
                <ComboboxInput placeholder="Buscar cliente" aria-label="Buscar cliente" />
              </div>
              <ComboboxContent>
                <ComboboxList>
                  {SEARCHABLE.map((option) => (
                    <ComboboxItem key={option.value} value={option.value}>
                      {option.label}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            <DateRangePicker value={range} onValueChange={setRange} className="w-64" />

            <ButtonGroup className="ml-auto">
              <Button
                variant="secondary"
                size="icon"
                aria-label="Ver em lista"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
              >
                <List size={16} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Ver em grade"
                aria-pressed={view === 'grid'}
                onClick={() => setView('grid')}
              >
                <Grid2x2 size={16} />
              </Button>
            </ButtonGroup>

            <Button
              onClick={() => toast.add({ title: 'Cadastro novo', description: 'Ainda por fazer.' })}
            >
              <Plus size={16} />
              Novo cliente
            </Button>
          </CardContent>
        </Card>

        {found.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="Nenhum cliente com esses filtros"
            description="Talvez o segmento escolhido não tenha ninguém no período."
            action={
              <Button size="sm" variant="secondary" onClick={clear}>
                Limpar filtros
              </Button>
            }
          />
        ) : view === 'list' ? (
          <Card>
            <CardContent className="px-2 py-2">
              {/* Botão direito na linha abre as ações: é onde a mão já está
                  quando se navega uma lista. */}
              {found.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onAction={onOpenInvoices}
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {found.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
