---
category: Formulário
---

# ComboboxInput

O campo de busca com o limpar e a seta encostados. Vive dentro do `Combobox`.

O `className` veste a raiz, que aqui é a moldura que segura o campo e os dois
botões — e não o `<input>`. Para alcançar cada uma delas pelo nome, use
`classNames` com as partes `wrapper` e `input`:

```tsx
<ComboboxInput classNames={{ input: "font-mono" }} />
```

É a diferença que separava esta peça do `AutocompleteInput`, que não tem moldura
e por isso veste o próprio campo com o `className`.
