---
category: Navegação
---

# MenuRadioGroup

O grupo de escolha única dentro do menu, e quem guarda o valor escolhido.

É o "Ordenar por" de uma listagem: uma ordem de cada vez. O valor vive aqui, e
não em cada item: `defaultValue` para deixar com a peça, `value` mais
`onValueChange` para deixar com a tela.

O título vem no `label`, pelo mesmo motivo do `MenuGroup`: a Base UI liga o
`aria-labelledby` do grupo ao título que mora dentro dele, e um título escrito
por fora não nomeia grupo nenhum (falha que não quebra tipo, só o anúncio).

```tsx
<MenuRadioGroup defaultValue="emissao" label="Ordenar por">
  <MenuRadioItem value="emissao" closeOnClick>Data de emissão</MenuRadioItem>
  <MenuRadioItem value="valor" closeOnClick>Valor</MenuRadioItem>
</MenuRadioGroup>
```

## Partes

`classNames` alcança o `label`, o mesmo título que o `MenuGroup` escreve.

## Quando não usar

Para opções que se acumulam (quais colunas mostrar, quais situações incluir no
filtro), use `MenuCheckboxItem`: lá cada linha é independente, aqui uma linha
apaga a anterior.

Se as opções cabem na tela e comparar entre elas importa, o menu esconde o que
deveria estar à vista: `RadioGroup` mostra todas de uma vez, e `ToggleGroup`
resolve as duas ou três que viram botão. O menu é para quando a escolha não
merece ocupar espaço permanente na barra.
