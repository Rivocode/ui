---
category: Ações
---

# Toolbar

Barra de ferramentas: os controles ficam numa parada de tabulacao só, e as
setas andam entre eles.

E isso que a diferencia de uma `div` com botões: **dez botões soltos sao dez
paradas de Tab** entre o campo anterior e o proximo. Numa barra, e uma.

```tsx
<ToolbarRoot>
  <ToolbarButton render={<Toggle />}>Negrito</ToolbarButton>
  <ToolbarButton render={<Toggle />}>Italico</ToolbarButton>
  <ToolbarSeparator />
  <ToolbarButton render={<Button variant="ghost" />}>Limpar formato</ToolbarButton>
</ToolbarRoot>
```

Use `ToolbarButton` com `render` para vestir `Button`, `Toggle` ou `Select` sem
perder essa navegação.
