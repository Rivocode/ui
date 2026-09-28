import { Badge, currencyShort } from '@rivocode/ui'
import { Kanban, type KanbanColumn, type KanbanMove } from '@rivocode/ui/dnd'
import { useState } from 'react'

type Note = { id: string; client: string; amount: number; late?: boolean }

const BOARD: KanbanColumn<Note>[] = [
  {
    id: 'todo',
    title: 'A emitir',
    items: [
      { id: '1041', client: 'Clínica São Lucas', amount: 3400 },
      { id: '1042', client: 'Padaria Pão Quente', amount: 780, late: true },
      { id: '1043', client: 'Oficina do Zé', amount: 1250 },
    ],
  },
  {
    id: 'review',
    title: 'Em análise',
    limit: 2,
    items: [
      { id: '1038', client: 'Escola Aprender', amount: 5600 },
      { id: '1039', client: 'Ótica Visão Clara', amount: 920 },
    ],
  },
  { id: 'done', title: 'Emitida', items: [] },
]

function move(columns: KanbanColumn<Note>[], { itemId, from, to, index }: KanbanMove) {
  const card = columns.find((column) => column.id === from)?.items.find((note) => note.id === itemId)
  if (!card) return columns
  return columns.map((column) => {
    const items = column.items.filter((note) => note.id !== itemId)
    if (column.id === to) items.splice(index, 0, card)
    return { ...column, items }
  })
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-fg-muted">Nota {note.id}</span>
        {note.late && (
          <Badge tone="danger" size="sm">
            Atrasada
          </Badge>
        )}
      </div>
      <span className="font-medium">{note.client}</span>
      <span className="tabular-nums text-fg-muted">{currencyShort(note.amount)}</span>
    </div>
  )
}

/** O quadro das notas */
export function Notes() {
  const [columns, setColumns] = useState(BOARD)

  return (
    <div className="w-full">
      <Kanban
        aria-label="Notas de setembro"
        columns={columns}
        getKey={(note) => note.id}
        getLabel={(note) => `Nota ${note.id}`}
        onMove={(change) => setColumns((now) => move(now, change))}
        renderCard={(note) => <NoteCard note={note} />}
      />
    </div>
  )
}

/** Acima do limite */
export function OverLimit() {
  const [columns, setColumns] = useState<KanbanColumn<Note>[]>(() =>
    move(BOARD, { itemId: '1041', from: 'todo', to: 'review', index: 0 }),
  )

  return (
    <div className="w-full">
      <Kanban
        aria-label="Notas de setembro"
        columns={columns}
        getKey={(note) => note.id}
        getLabel={(note) => `Nota ${note.id}`}
        onMove={(change) => setColumns((now) => move(now, change))}
        renderCard={(note) => <NoteCard note={note} />}
      />
    </div>
  )
}
