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

/** Default */
export function Default() {
  const [filters, setFilters] = useState(APPLIED)

  return (
    <div className="w-full max-w-xl">
      <FilterBar filters={filters} onFiltersChange={setFilters} />
    </div>
  )
}

/** The saved row */
export function Reserved() {
  return (
    <div className="w-full max-w-xl">
      <FilterBar filters={[]} onFiltersChange={() => {}} />
    </div>
  )
}

/** A filter the app locks */
export function Locked() {
  const [filters, setFilters] = useState(WITH_SCOPE)

  return (
    <div className="w-full max-w-xl">
      <FilterBar filters={filters} onFiltersChange={setFilters} clearFrom={1} />
    </div>
  )
}

/** Narrow, with scrolling */
export function Narrow() {
  const [filters, setFilters] = useState(APPLIED)

  return (
    <div className="w-[390px] max-w-full">
      <FilterBar filters={filters} onFiltersChange={setFilters} size="sm" />
    </div>
  )
}

/** While the query reruns */
export function Busy() {
  return (
    <div className="w-full max-w-xl">
      <FilterBar filters={APPLIED} onFiltersChange={() => {}} disabled />
    </div>
  )
}
