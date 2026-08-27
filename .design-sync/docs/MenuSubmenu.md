---
category: Navegação
---

# MenuSubmenu

Um ramo do menu, que abre ao lado.

Não pinta elemento nenhum: é só estado. Dentro dele vão o `MenuSubmenuTrigger`,
que é o item que abre o ramo, e um `MenuContent`, que é o mesmo painel do menu
de cima.

O lado não precisa ser pedido. A Base UI abre o ramo em `inline-end` quando o
pai é um menu, e vira para o outro lado sozinha quando não cabe. Passar `side`
aqui é para quem tem motivo, não obrigação.

```tsx
<MenuContent>
  <MenuItem>Duplicar</MenuItem>
  <MenuSubmenu>
    <MenuSubmenuTrigger>Exportar</MenuSubmenuTrigger>
    <MenuContent>
      <MenuItem>XML da NF-e</MenuItem>
      <MenuItem>PDF do DANFE</MenuItem>
    </MenuContent>
  </MenuSubmenu>
</MenuContent>
```

O `MenuSubmenuTrigger` traz a seta que avisa que há mais adiante, e `classNames`
alcança ela pelo nome `indicator`. O item fica aceso enquanto o ramo está
aberto: sem isso o realce sai assim que o ponteiro entra no painel filho, e nada
mais liga um ao outro.

## Quando não usar

Um nível resolve quase tudo. Dois já é uma árvore, e árvore com o mouse em cima
é como andar na diagonal sem perder a linha: quem escorrega fecha o ramo inteiro
e recomeça. Passando disso, `Dialog` ou uma tela própria custam menos a quem usa.

Para o menu que abre no botão direito sobre uma área, o gatilho é outro:
`ContextMenu`. E para a navegação principal do site, com painéis largos e links,
é `NavigationMenu`: o submenu daqui é uma lista de ações, e não um mapa de
seções.
