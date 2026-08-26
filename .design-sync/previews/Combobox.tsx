import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@rivocode/ui'

const CLIENTES = [
  { value: 'clinica', label: 'Clínica São Lucas' },
  { value: 'transportes', label: 'Transportes Cabo Branco' },
  { value: 'supermercado', label: 'Supermercado Tambau' },
  { value: 'construtora', label: 'Construtora Litoral' },
]

/** Busca em lista */
export function SearchInList() {
  return (
    <div className="min-h-72 w-80">
      <Combobox items={CLIENTES} defaultOpen /* rc-keep-open */>
        <ComboboxInput aria-label="Buscar cliente" placeholder="Buscar cliente" />
        <ComboboxContent emptyMessage="Nenhum cliente com esse nome.">
          <ComboboxList>
            {(item: (typeof CLIENTES)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

/** Escolha múltipla */
export function MultipleChoice() {
  return (
    <div className="min-h-72 w-80">
      <Combobox items={CLIENTES} multiple defaultValue={[CLIENTES[0]!, CLIENTES[2]!]}>
        <ComboboxChips>
          <ComboboxValue>
            {(escolhidos: (typeof CLIENTES)[number][]) =>
              escolhidos.map((cliente) => (
                <ComboboxChip key={cliente.value} aria-label={cliente.label}>
                  {cliente.label}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxInput aria-label="Buscar cliente" placeholder="Buscar cliente" clearable={false} />
        </ComboboxChips>

        <ComboboxContent emptyMessage="Nenhum cliente com esse nome.">
          <ComboboxList>
            {(item: (typeof CLIENTES)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
