---
category: Navegação
---

# MenuCheckboxItem

Um item do menu que liga e desliga uma opção, sem fechar o menu.

É o menu de "Colunas" de uma listagem: quais colunas da tabela de notas
aparecem. Cada item guarda o próprio estado com `defaultChecked`, ou responde a
`checked` e `onCheckedChange` quando quem manda é a tela.

Marcar **não fecha** o menu — `closeOnClick` nasce `false`, como na Base UI —,
porque quem escolhe colunas escolhe várias de uma vez.

```tsx
<MenuContent>
  <MenuGroup label="Mostrar na listagem">
    <MenuCheckboxItem defaultChecked disabled>Número</MenuCheckboxItem>
    <MenuCheckboxItem defaultChecked>Cliente</MenuCheckboxItem>
    <MenuCheckboxItem>Valor</MenuCheckboxItem>
  </MenuGroup>
</MenuContent>
```

## Partes

`classNames` alcança o `indicator`, que é a coluna da marca. Ela existe mesmo no
item desmarcado de propósito: o indicador da Base UI só monta quando o item está
ligado, e sem uma coluna fixa o texto de todas as linhas andava para o lado a
cada clique. A largura é a mesma do `SelectItem` e do `ComboboxItem`, para as
três listas alinharem o texto na mesma coluna.

## Quando não usar

Para uma escolha entre alternativas que se excluem — ordenar por data **ou** por
valor —, use `MenuRadioItem` dentro de um `MenuRadioGroup`: o ponto diz que
escolher esta desescolhe a de cima, o que a marca de certo não diz.

E não troque por um `Checkbox` solto dentro de um `Popover`, que era o caminho
que sobrava antes desta peça. Ele custa as duas coisas que só o menu dá: o
`aria-checked` de item de menu, que é como o leitor de tela anuncia a linha, e a
navegação por seta e por primeira letra que a lista de menu já traz. Um `Popover`
é um painel com conteúdo qualquer; ninguém anda nele com o teclado como se anda
num menu.

Quando as opções são muitas e pedem busca, o menu não é o lugar: a lista com
campo de digitar é `Combobox` com `multiple`.
