import { Badge, Item, ItemActions, ItemContent, ItemDescription, ItemTitle, currencyShort } from '@rivocode/ui'
import { SortableList } from '@rivocode/ui/dnd'
import { useState } from 'react'

type Note = { id: number; number: string; client: string; amount: number; due: string }

const QUEUE: Note[] = [
  { id: 1, number: '1041', client: 'Clínica São Lucas', amount: 3400, due: '26/09' },
  { id: 2, number: '1042', client: 'Padaria Pão Quente', amount: 780, due: '27/09' },
  { id: 3, number: '1043', client: 'Oficina do Zé', amount: 1250, due: '30/09' },
  { id: 4, number: '1044', client: 'Escola Aprender', amount: 5600, due: '02/10' },
  { id: 5, number: '1045', client: 'Ótica Visão Clara', amount: 920, due: '05/10' },
]

/** A fila de emissão */
export function IssueQueue() {
  const [notes, setNotes] = useState(QUEUE)

  return (
    <div className="w-full max-w-lg">
      <SortableList
        aria-label="Ordem de emissão"
        items={notes}
        getKey={(note) => note.id}
        getLabel={(note) => `Nota ${note.number}`}
        onReorder={setNotes}
        renderItem={(note, { index }) => (
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{note.client}</ItemTitle>
              <ItemDescription>
                Nota {note.number} · vence {note.due}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <span className="text-sm tabular-nums text-fg">{currencyShort(note.amount)}</span>
              {index === 0 && (
                <Badge tone="accent" size="sm">
                  Próxima
                </Badge>
              )}
            </ItemActions>
          </Item>
        )}
      />
    </div>
  )
}

const STAGES = ['Conferir cadastro', 'Calcular impostos', 'Emitir nota', 'Enviar ao cliente']

/** Horizontal, com a linha inteira como alça */
export function Stages() {
  const [stages, setStages] = useState(STAGES)

  return (
    <div className="w-full max-w-2xl">
      <SortableList
        aria-label="Etapas do fechamento"
        orientation="horizontal"
        handle={false}
        items={stages}
        getKey={(stage) => stage}
        getLabel={(stage) => stage}
        onReorder={setStages}
        labels={{
          handle: (label) => `Mover a etapa ${label}`,
          moved: (label, position, total) => `Etapa ${label} agora é a ${position}ª de ${total}.`,
        }}
        renderItem={(stage, { handleProps, isDragging, index }) => (
          <div
            {...handleProps}
            className={
              'flex cursor-grab items-center gap-2 rounded-md border border-border bg-surface ' +
              'px-3 py-2 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
              (isDragging ? 'shadow-2' : '')
            }
          >
            <span className="font-mono text-xs text-fg-muted">{index + 1}</span>
            {stage}
          </div>
        )}
      />
    </div>
  )
}

/** Desabilitada enquanto salva */
export function Saving() {
  return (
    <div className="w-full max-w-lg">
      <SortableList
        aria-label="Ordem de emissão"
        disabled
        items={QUEUE.slice(0, 3)}
        getKey={(note) => note.id}
        getLabel={(note) => `Nota ${note.number}`}
        onReorder={() => {}}
        renderItem={(note) => (
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{note.client}</ItemTitle>
            </ItemContent>
          </Item>
        )}
      />
    </div>
  )
}
