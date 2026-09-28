import { useState } from 'react'
import { FilterBar, type AppliedFilter } from '@rivocode/ui'

const APPLIED: AppliedFilter[] = [
  { id: 'status', label: 'Situação', value: 'Em aberto' },
  { id: 'customer', label: 'Cliente', value: 'Clínica São Lucas' },
  { id: 'period', label: 'Emissão', value: '01/08 a 31/08' },
]

const WITH_SCOPE: AppliedFilter[] = [
  { id: 'branch', label: 'Filial', value: 'Matriz', removable: false },
  { id: 'status', label: 'Situação', value: 'Vencidas' },
]

/** Padrão */
export function Default() {
  const [filters, setFilters] = useState(APPLIED)

  return (
    <div className="w-full max-w-xl">
      <FilterBar filters={filters} onFiltersChange={setFilters} />
    </div>
  )
}

/** A linha guardada */
export function Reserved() {
  return (
    <div className="w-full max-w-xl">
      <FilterBar filters={[]} onFiltersChange={() => {}} />
    </div>
  )
}

/** Filtro que o app trava */
export function Locked() {
  const [filters, setFilters] = useState(WITH_SCOPE)

  return (
    <div className="w-full max-w-xl">
      <FilterBar filters={filters} onFiltersChange={setFilters} clearFrom={1} />
    </div>
  )
}

/** Estreito, com rolagem */
export function Narrow() {
  const [filters, setFilters] = useState(APPLIED)

  return (
    <div className="w-[390px] max-w-full">
      <FilterBar filters={filters} onFiltersChange={setFilters} size="sm" />
    </div>
  )
}

/** Enquanto a consulta refaz */
export function Busy() {
  return (
    <div className="w-full max-w-xl">
      <FilterBar filters={APPLIED} onFiltersChange={() => {}} disabled />
    </div>
  )
}
