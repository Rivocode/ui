import { DataTable, SearchInput, type Column } from '@rivocode/ui'
import { useState } from 'react'

/** Padrão */
export function Default() {
  return (
    <div className="w-full max-w-sm">
      <SearchInput placeholder="Buscar nota…" aria-label="Buscar nota" />
    </div>
  )
}

/** Com atalho */
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

/** Alimentando uma tabela */
export function WithTable() {
  const [filter, setFilter] = useState('')
  return (
    <div className="flex w-full flex-col gap-3">
      {/* O campo é do app; a tabela só recebe o texto, sem acento atrapalhar. */}
      <SearchInput
        placeholder="Buscar por cliente ou número…"
        aria-label="Buscar nota"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        onClear={() => setFilter('')}
        className="max-w-64"
      />
      <DataTable data={NOTAS} columns={COLUNAS} rowKey={(nota) => nota.id} filter={filter} />
    </div>
  )
}
