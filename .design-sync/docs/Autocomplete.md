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

Quando o valor **tem que** ser uma das opções (o cliente da nota, a conta
contábil, a unidade de medida), use `Combobox`. É essa a diferença entre os
dois: lá a lista manda, aqui a sugestão ajuda e o texto livre vale. Deixar
passar "Clínica São Lucaz" num campo que devia apontar para um cadastro é um
erro que só aparece no relatório do mês seguinte.

## No React Native

Traduz, e o que o `Autocomplete` tem de próprio veio junto: o `value` é o texto digitado, e o que não está na lista vale. No nativo ele é controlado (`value` e `onValueChange` obrigatórios) e as sugestões entram por `items` na raiz, em texto, rasas ou em grupos `{ label, items }` - no lugar do `AutocompleteInput` com o painel do `Combobox` por filho. O `label` é obrigatório: é o nome que o leitor de tela anuncia e o título da folha.

O campo abre numa folha de baixo, com o texto no alto e as sugestões logo abaixo, e não numa lista presa ao campo. É o teclado que decide isso: aberto, ele cobre a metade de baixo da tela, e a lista de um campo no pé do formulário nasceria escondida. A folha sobe junto com ele, como a do `Combobox`. Cada tecla chega ao `onValueChange`, tocar numa sugestão preenche o texto e fecha, e **Concluir** fecha com o que foi digitado. A contagem de sugestões é anunciada a cada mudança, como a região viva do web. Não há completar inline: não existe `mode`.
