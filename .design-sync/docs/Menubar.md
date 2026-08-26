---
category: Navegação
---

# Menubar

A barra de menus de aplicativo: Arquivo, Editar, Exibir.

Coordena vários `Menu` lado a lado: com um aberto, passar o mouse sobre o
vizinho já troca, sem novo clique, e as setas andam entre eles.

**Em tela de web isso quase nunca e o certo.** Barra de menus e vocabulário de
programa de mesa; num painel, `Sidebar` e `Tabs` dizem mais. Ela existe para
editor e ferramenta, onde o usuário já espera esse arranjo.

```tsx
<Menubar>
  <Menu>
    <MenuTrigger>Arquivo</MenuTrigger>
    <MenuContent>
      <MenuItem>Nova nota</MenuItem>
      <MenuItem>Abrir</MenuItem>
    </MenuContent>
  </Menu>
</Menubar>
```

## As partes

`MenubarTrigger` é o gatilho de cada menu da barra: "Arquivo", "Editar",
"Exibir". Ele já vem vestido, inclusive com o anel de foco — dentro da barra é
ele que se usa, e não um `MenuTrigger` com classe na mão.

## No React Native

Não porta, por decisão — idioma de mesa; navegação nativa é tab bar e drawer do router. Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de cada uma.
