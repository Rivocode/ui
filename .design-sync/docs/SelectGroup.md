---
category: Formulário
---

# SelectGroup

Uma família dentro da lista, com o `SelectGroupLabel` de cabeçalho.

Natureza de operação separada em entrada e saída, UF por região, plano de contas
por grupo: a lista longa que tem famílias de verdade lê-se por partes, e não de
cima a baixo.

O desenho é o do `ComboboxGroup`, e não o do `MenuGroup` com `label`: as duas são
peças de formulário e listam opções, e quem troca uma pela outra ao descobrir que
a lista cresceu não deveria ter que reescrever a árvore.

```tsx
<SelectContent>
  <SelectGroup>
    <SelectGroupLabel>Saída</SelectGroupLabel>
    <SelectItem value="5102">Venda de mercadoria</SelectItem>
    <SelectItem value="5915">Remessa para conserto</SelectItem>
  </SelectGroup>

  <SelectSeparator />

  <SelectGroup>
    <SelectGroupLabel>Entrada</SelectGroupLabel>
    <SelectItem value="1202">Devolução de venda</SelectItem>
  </SelectGroup>
</SelectContent>
```

O `items` da raiz continua sendo a lista **inteira e plana**: é por ele que o
gatilho traduz o valor guardado no rótulo que a pessoa leu. O grupo arruma a
lista aberta, e não o que o gatilho mostra.

O `SelectGroupLabel` vive dentro do grupo porque é o grupo que aponta o
`aria-labelledby` para ele. Título escrito ao lado não nomeia nada — e nenhum
tipo reclama.

## Quando não usar

Quando agrupar é a tentativa de domar uma lista que ficou grande demais, o
remédio é outro: `Combobox`, que traz a busca. Rolar cento e vinte cidades
arrumadas por região continua sendo rolar cento e vinte cidades, e o cabeçalho só
acrescenta altura ao caminho.

Grupo de dois itens não paga o cabeçalho que cobra. Sem famílias de verdade, a
lista plana diz a mesma coisa em menos linhas.
