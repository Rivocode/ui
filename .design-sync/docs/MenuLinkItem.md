---
category: Navegação
---

# MenuLinkItem

O item do menu que navega, e por isso sai como `<a>` de verdade.

É o "Meu perfil" do menu do avatar. O que se ganha é o que só a âncora tem: o
botão do meio abre em outra aba, o botão direito copia o endereço, e a barra do
navegador mostra para onde o item leva antes do clique.

```tsx
<MenuContent>
  <MenuLinkItem href="/perfil">Meu perfil</MenuLinkItem>
  <MenuLinkItem render={<Link to="/assinatura" />}>Assinatura</MenuLinkItem>
</MenuContent>
```

Com roteador de uma página só, passe o componente de link dele em `render`: o
elemento é seu, e a peça só empresta a pele e o comportamento de menu.

**`closeOnClick` nasce `true` aqui, e na Base UI nasce `false`.** O motivo é a
navegação pelo cliente: sem recarregar a página ninguém desmonta o menu, e ele
ficava aberto flutuando sobre a tela nova. Quem quiser o comportamento da Base UI
passa `closeOnClick={false}`.

## Quando não usar

Para o que acontece na mesma tela (duplicar, exportar, cancelar), use
`MenuItem`. Âncora que não leva a lugar nenhum (`href="#"` com `onClick`) engana
as três affordances acima, e é pior do que um item comum.

Um menu inteiro de links é um menu de navegação, e não de ações: aí a peça é
`NavigationMenu`, ou a `Sidebar` quando os destinos são as seções do painel.
