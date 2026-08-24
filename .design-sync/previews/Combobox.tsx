import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from '@rivocode/ui'

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
      <Combobox items={CLIENTES} defaultOpen>
        <ComboboxInput placeholder="Buscar cliente" />
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
