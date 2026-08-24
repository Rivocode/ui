---
category: Sobreposição
---

# ContextMenu

O menu do botão direito.

O conteúdo e o mesmo do `Menu`: use `MenuContent`, `MenuItem`, `MenuGroup` e
`MenuSeparator` dentro dele. Só o gatilho muda, porque aqui quem abre e a área
inteira, e não um botão.

**Nunca deixe uma ação existir só aqui.** No celular não ha botão direito, e
quem navega por teclado depende da tecla de menu, que nem todo teclado tem. Ele
acelera o que já esta em outro lugar, no menu de ações da linha, por exemplo.

```tsx
<ContextMenu>
  <ContextMenuTrigger className="rounded-md border border-dashed p-6">
    Clique com o botao direito
  </ContextMenuTrigger>
  <MenuContent>
    <MenuItem>Baixar PDF</MenuItem>
    <MenuItem>Duplicar</MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger">Cancelar nota</MenuItem>
  </MenuContent>
</ContextMenu>
```
