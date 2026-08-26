---
category: Navegação
---

# NavigationMenu

A navegação de topo de site, com painel por secao.

Não e `Menu`: aquele lista ações que se executam, este lista lugares para onde
ir, e o painel pode ter texto, imagem e várias colunas. O leitor de tela anuncia
os dois de formas diferentes, e trocar um pelo outro faz o menu de ações
prometer navegação que não existe.

**Em tela de aplicação, `Sidebar` costuma servir melhor.** Este e para página de
marketing e portal.

```tsx
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="/notas">Emissao de notas</NavigationMenuLink>
        <NavigationMenuLink href="/cobranca">Cobranca</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

O painel e único e fica fora da lista: e ele que desliza de uma secao para a
outra em vez de piscar entre paineis.

## As partes

`NavigationMenuViewport` é o painel onde o conteúdo do item aberto aparece.
Fica fora dos itens, e não dentro de cada um: assim a troca entre dois menus
vizinhos anima de um para o outro em vez de fechar e abrir.
