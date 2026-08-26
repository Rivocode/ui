import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
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

const CIDADES = [
  { value: 'joao-pessoa', label: 'João Pessoa', uf: 'Paraíba' },
  { value: 'campina-grande', label: 'Campina Grande', uf: 'Paraíba' },
  { value: 'recife', label: 'Recife', uf: 'Pernambuco' },
  { value: 'caruaru', label: 'Caruaru', uf: 'Pernambuco' },
]

/** Lista com famílias */
export function Grouped() {
  return (
    <div className="min-h-80 w-80">
      <Combobox items={CIDADES} defaultOpen /* rc-keep-open */>
        <ComboboxInput aria-label="Buscar cidade" placeholder="Buscar cidade" />
        <ComboboxContent emptyMessage="Nenhuma cidade com esse nome.">
          <ComboboxList>
            {/* Agrupar so paga quando as familias sao de verdade. Grupo de dois
                itens acrescenta cabecalho e nao tira trabalho de quem procura -
                e a busca, que e o motivo desta peca existir, ja resolvia. */}
            <ComboboxGroup>
              <ComboboxGroupLabel>Paraíba</ComboboxGroupLabel>
              {CIDADES.filter((c) => c.uf === 'Paraíba').map((c) => (
                <ComboboxItem key={c.value} value={c}>
                  {c.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>

            <ComboboxSeparator />

            <ComboboxGroup>
              <ComboboxGroupLabel>Pernambuco</ComboboxGroupLabel>
              {CIDADES.filter((c) => c.uf === 'Pernambuco').map((c) => (
                <ComboboxItem key={c.value} value={c}>
                  {c.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
