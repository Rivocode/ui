---
category: Navegação
---

# MenubarTrigger

O gatilho de um menu dentro da barra: "Arquivo", "Editar", "Exibir".

Já vem vestido — respiro, canto, cor de texto, o realce da passagem do mouse, o
estado de aberto e o anel de foco do teclado. Dentro de um `Menubar` é ele que
se usa, e não sobra nada para escrever por fora.

```tsx
<Menubar aria-label="Principal">
  <Menu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenuContent>
      <MenuItem>Nova nota</MenuItem>
      <MenuItem>Abrir rascunho</MenuItem>
    </MenuContent>
  </Menu>

  <Menu>
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenuContent>
      <MenuItem>Desfazer</MenuItem>
    </MenuContent>
  </Menu>
</Menubar>
```

## Por que ele existe, se já há `MenuTrigger`

O `MenuTrigger` sai sem estilo de propósito: o uso comum dele é
`render={<Button />}`, e duas fontes de estilo brigariam. Quem pagava por isso
era a barra. O exemplo publicado repetia as mesmas cinco classes em cada item, e
toda barra montada a partir dele repetia de novo — e a cópia vinha sem o anel de
foco, então a barra da documentação era a única peça do catálogo que sumia da
vista ao ser percorrida com o Tab.

Os dois continuam existindo porque têm trabalhos diferentes: um é gatilho de
menu em qualquer lugar, o outro é item de uma barra.

## Quando **não** usar

Fora de um `Menubar`, é `MenuTrigger` cru. O menu solto — os três pontinhos de
uma linha de tabela, o botão de ações de um cartão — abre com
`render={<Button variant="ghost" />}`, e a pele de item de barra ali desalinha o
gatilho dos outros controles da linha e promete uma barra que não existe.

Se a dúvida for entre barra de menus e outra coisa, ela é sobre o `Menubar`
inteiro, e não sobre o gatilho: em tela de web, `Sidebar` e `Tabs` quase sempre
dizem mais.
