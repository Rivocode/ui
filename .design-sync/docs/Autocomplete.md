---
category: Formulário
---

# Autocomplete

Campo que sugere enquanto se digita, e aceita o que não esta na lista.

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

## Quando não usar

Quando o valor **tem que** ser uma das opções — o cliente da nota, a conta
contábil, a unidade de medida — use `Combobox`. É essa a diferença entre os
dois: lá a lista manda, aqui a sugestão ajuda e o texto livre vale. Deixar
passar "Clínica São Lucaz" num campo que devia apontar para um cadastro é um
erro que só aparece no relatório do mês seguinte.

## No React Native

No React Native quem cobre este caso é o `Combobox` — com uma perda que precisa entrar na sua decisão: ele **não aceita valor fora da lista**. O que o `Autocomplete` tem de próprio, que é deixar a pessoa escrever o que não está cadastrado, não existe lá. Se o campo precisa aceitar o inédito, no celular ele é um `Input` seu com sugestões, e não esta peça.
