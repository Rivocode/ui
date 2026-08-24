---
category: Formulário
---

# Autocomplete

Campo que sugere enquanto se digita, e aceita o que não esta na lista.

E essa a diferença para o `Combobox`: la a lista manda, e o valor final tem que
ser uma das opções. Aqui a sugestao ajuda e o texto livre vale, que é o que
serve para busca, endereco e nome de cidade.

**O painel e o mesmo do Combobox.** Use `ComboboxContent`, `ComboboxList` e
`ComboboxItem` dentro dele; só o campo troca, para `AutocompleteInput`.

```tsx
<Autocomplete items={CIDADES}>
  <AutocompleteInput placeholder="Cidade" />
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
```
