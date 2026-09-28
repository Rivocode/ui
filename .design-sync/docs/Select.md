---
category: Formulário
---

# Select

Escolha única em lista.

Compõe com `SelectTrigger`, `SelectValue`, `SelectContent` e `SelectItem`.
Lista com famílias de verdade ganha `SelectGroup` com `SelectGroupLabel`, e
`SelectSeparator` entre uma família e outra.

**Passe `items` com `{ label, value }` na raiz.** Sem isso o gatilho mostra o
valor cru em vez do rótulo, e essa é a armadilha mais fácil de cair aqui.

Renderiza em portal, então exige o `RivoProvider`.

`size` mora na raiz, com o vocabulário do `Input`: `sm`, `md` (padrão) e `lg`,
com a mesma altura, o mesmo recuo e o mesmo corpo de texto. O `SelectTrigger`
de dentro veste o tamanho sozinho, então um filtro com `Input size="sm"` e
`Select size="sm"` lado a lado fica numa linha só.

```tsx
<Select items={STATUS} size="sm">
  <SelectTrigger aria-label="Status">
    <SelectValue placeholder="Todos" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="abertas">Abertas</SelectItem>
  </SelectContent>
</Select>
```

## Quando não usar

Quando a lista é grande demais para caber na cabeça de quem escolhe, ou quando
ela vem do servidor, use `Combobox`: ele traz a busca junto. Rolar cento e
vinte cidades numa lista sem campo de digitar é o mesmo trabalho de procurar
numa gaveta.

Para duas ou três opções que cabem lado a lado, o `RadioGroup` mostra todas de
uma vez e economiza o clique de abrir. E para um liga-desliga, o `Switch`.

## No React Native

Traduz, e a forma de escrever é outra. No web o `Select` pede `items` na raiz **e** as quatro partes (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`); no nativo ele é uma tag só (`<Select items={…} value={…} onValueChange={…} label="Período" />`), e a lista abre numa folha de baixo, que é o idioma da plataforma para escolher. O `label` é obrigatório: é por ele que o leitor de tela anuncia o gatilho, papel que no web era do `SelectTrigger`.

Famílias de opções entram pelo mesmo `items`, em grupos `{ label, items }` - a forma que o `items` do web também aceita. A folha vira uma `SectionList`, e cada `label` de grupo é anunciado como cabeçalho, no lugar do `SelectGroupLabel`.
