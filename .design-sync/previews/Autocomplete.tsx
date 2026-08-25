import {
  Autocomplete,
  AutocompleteInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
} from '@rivocode/ui'

const CIDADES = ['Joao Pessoa', 'Campina Grande', 'Cabedelo', 'Bayeux', 'Patos']

/** Busca com texto livre */
export function FreeTextSearch() {
  return (
    <div className="min-h-64 w-80">
      <Autocomplete items={CIDADES} defaultOpen>
        <AutocompleteInput aria-label="Cidade" placeholder="Cidade" />
        <ComboboxContent emptyMessage="Nenhuma cidade com esse nome.">
          <ComboboxList>
            {(cidade: string) => (
              <ComboboxItem key={cidade} value={cidade}>
                {cidade}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Autocomplete>
    </div>
  )
}
