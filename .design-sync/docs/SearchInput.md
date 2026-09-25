---
category: Formulário
---

# SearchInput

O campo de busca com a lupa no lugar: o arranjo que toda listagem montava na
mão com `position: absolute`.

Sai como `<input type="search">`, então o leitor de tela anuncia "busca" e o
Esc limpa: o campo não controlado sozinho, o controlado pelo `onClear`.

`onValueChange` entrega o texto a cada tecla, como no `Input` e no
`SearchInput` do React Native, e sem `onClear` o Esc também o chama com `""`.
Com ele, o campo controlado é `value` mais `onValueChange`, sem tirar o texto
de dentro do evento. O `onChange` do DOM continua chamado junto.

```tsx
const [filter, setFilter] = useState("");

<SearchInput aria-label="Buscar nota" value={filter} onValueChange={setFilter} />
```

`shortcut` mostra o atalho num `Kbd` dentro do campo (`"mod+k"` sai ⌘K no Mac
e Ctrl K no resto). Só o desenho: registrar o atalho é trabalho de quem monta
a tela, porque é ela que sabe o que mais escuta teclado.

Combina com o `filter` do `DataTable`: o campo fica onde a tela pedir e a
tabela só recebe o texto.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `SearchInput` - `value` e `onValueChange` obrigatórios. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
