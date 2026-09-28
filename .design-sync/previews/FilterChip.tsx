import { useState } from 'react'
import { FilterChip } from '@rivocode/ui'

/** Padrão */
export function Default() {
  const [applied, setApplied] = useState(true)

  return applied ? (
    <FilterChip label="Cliente" value="Clínica São Lucas" onRemove={() => setApplied(false)} />
  ) : (
    <FilterChip label="Cliente" value="todos" />
  )
}

/** Sem xis, porque o app trava */
export function Locked() {
  return <FilterChip label="Filial" value="Matriz" />
}

/** O valor que não cabe */
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

/** As duas alturas */
export function Sizes() {
  return (
    <div className="flex items-center gap-2">
      <FilterChip size="sm" label="Situação" value="Em aberto" onRemove={() => {}} />
      <FilterChip size="md" label="Situação" value="Em aberto" onRemove={() => {}} />
    </div>
  )
}
