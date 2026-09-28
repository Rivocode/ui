import { useState } from 'react'
import { FilterChip } from '@rivocode/ui'

/** Default */
export function Default() {
  const [applied, setApplied] = useState(true)

  return applied ? (
    <FilterChip label="Cliente" value="Clínica São Lucas" onRemove={() => setApplied(false)} />
  ) : (
    <FilterChip label="Cliente" value="todos" />
  )
}

/** No close button, because the app locks it */
export function Locked() {
  return <FilterChip label="Filial" value="Matriz" />
}

/** The value that does not fit */
export function LongValue() {
  return (
    <div className="w-72">
      <FilterChip
        label="Cliente"
        value="Clínica São Lucas Serviços Médicos e Hospitalares Ltda"
        onRemove={() => {}}
      />
    </div>
  )
}

/** The two heights */
export function Sizes() {
  return (
    <div className="flex items-center gap-2">
      <FilterChip size="sm" label="Situação" value="Em aberto" onRemove={() => {}} />
      <FilterChip size="md" label="Situação" value="Em aberto" onRemove={() => {}} />
    </div>
  )
}
