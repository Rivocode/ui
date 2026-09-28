import { DataTable, SearchInput, type Column } from '@rivocode/ui'
import { useState } from 'react'

/** Default */
export function Default() {
  return (
    <div className="w-full max-w-sm">
      <SearchInput placeholder="Buscar nota…" aria-label="Buscar nota" />
    </div>
  )
}

/** With shortcut */
export function WithShortcut() {
  return (
    <div className="w-full max-w-sm">
      <SearchInput placeholder="Buscar em tudo…" aria-label="Buscar em tudo" shortcut="mod+k" />
    </div>
  )
}

type Nota = { id: string; number: string; customer: string }

const NOTAS: Nota[] = [
  { id: '1', number: '4813', customer: 'Clínica São Lucas' },
  { id: '2', number: '4814', customer: 'Transportes Cabo Branco' },
  { id: '3', number: '4815', customer: 'Ótica Central' },
]

const COLUNAS: Column<Nota>[] = [
  { key: 'number', header: 'Número' },
  { key: 'customer', header: 'Cliente' },
]

/** Feeding a table */
export function WithTable() {
  const [filter, setFilter] = useState('')
  return (
    <div className="flex w-full flex-col gap-3">
      {/* The field belongs to the app; the table only receives the text, with accents not getting in the way. */}
      <SearchInput
        placeholder="Buscar por cliente ou número…"
        aria-label="Buscar nota"
        value={filter}
        onValueChange={setFilter}
        className="max-w-64"
      />
      <DataTable data={NOTAS} columns={COLUNAS} rowKey={(nota) => nota.id} filter={filter} />
    </div>
  )
}
