import { useState } from 'react'
import { DescriptionItem, DescriptionList, Editable } from '@rivocode/ui'

/** Corrigir sem sair da tela */
export function FixInPlace() {
  const [customer, setCustomer] = useState('Clínica São Lucas')
  const [note, setNote] = useState('')

  return (
    <div className="w-80">
      <DescriptionList>
        <DescriptionItem label="Cliente">
          <Editable value={customer} onValueChange={setCustomer} label="Cliente" />
        </DescriptionItem>
        <DescriptionItem label="Observação">
          <Editable
            value={note}
            onValueChange={setNote}
            label="Observação"
            placeholder="Sem observação"
          />
        </DescriptionItem>
      </DescriptionList>
    </div>
  )
}
