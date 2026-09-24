import { ActionBar, Button, DataTable, type Column } from '@rivocode/ui'
import { Download, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

type Invoice = {
  id: string
  number: string
  customer: string
  amount: string
}

const INVOICES: Invoice[] = [
  { id: '1', number: '1042', customer: 'Padaria Aurora', amount: 'R$ 1.280,00' },
  { id: '2', number: '1043', customer: 'Transportes Cabo Branco', amount: 'R$ 4.950,00' },
  { id: '3', number: '1044', customer: 'Clínica São Lucas', amount: 'R$ 2.310,00' },
  { id: '4', number: '1045', customer: 'Mercado Tambaú', amount: 'R$ 860,00' },
  { id: '5', number: '1046', customer: 'Escola Pequeno Príncipe', amount: 'R$ 3.400,00' },
]

const COLUMNS: Column<Invoice>[] = [
  { key: 'number', header: 'Nota' },
  { key: 'customer', header: 'Cliente' },
  { key: 'amount', header: 'Valor', align: 'right' },
]

/** Com a seleção do DataTable */
export function WithDataTable() {
  const [selected, setSelected] = useState<string[]>(['2', '3'])

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable
        data={INVOICES}
        columns={COLUMNS}
        rowKey={(invoice) => invoice.id}
        selectable
        value={selected}
        onValueChange={setSelected}
      />
      <ActionBar count={selected.length} onClear={() => setSelected([])}>
        <Button size="sm" variant="secondary">
          <Download aria-hidden="true" size={14} />
          Exportar XML
        </Button>
        <Button size="sm" variant="destructive">
          <Trash2 aria-hidden="true" size={14} />
          Cancelar notas
        </Button>
      </ActionBar>
    </div>
  )
}

/** Com o nome do item */
export function NamedItems() {
  const [selected, setSelected] = useState<string[]>(['1'])
  const table = useRef<HTMLDivElement>(null)

  return (
    <div ref={table} tabIndex={-1} className="flex w-full flex-col gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <DataTable
        data={INVOICES}
        columns={COLUMNS}
        rowKey={(invoice) => invoice.id}
        selectable
        value={selected}
        onValueChange={setSelected}
      />
      <ActionBar
        count={selected.length}
        onClear={() => setSelected([])}
        finalFocus={table}
        labels={{
          selected: (count) =>
            count === 1 ? '1 nota selecionada' : `${count} notas selecionadas`,
        }}
      >
        <Button size="sm" variant="secondary">
          Reenviar por e-mail
        </Button>
      </ActionBar>
    </div>
  )
}
