import {
  Autocomplete,
  AutocompleteInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
} from '@rivocode/ui'

const CIDADES = ['Joao Pessoa', 'Campina Grande', 'Cabedelo', 'Bayeux', 'Patos']

/** Search with free text */
export function FreeTextSearch() {
  return (
    <div className="min-h-64 w-80">
      <Autocomplete items={CIDADES} defaultOpen /* rc-keep-open */>
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
