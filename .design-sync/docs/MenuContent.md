---
category: Navegação
---

# MenuContent

O painel flutuante do menu, com portal, posicionamento e a virada de lado
quando não cabe.

Usa a mesma casca visual do `SelectContent` e do `TooltipContent`: o que
flutua nesta biblioteca se parece de propósito. E se posiciona igual — `side`,
`align` e `sideOffset` significam a mesma coisa nas cinco, e abrem a 6px do
gatilho quando ninguém pede outra folga.

```tsx
<MenuContent side="top" align="end">
  <MenuItem>Baixar PDF</MenuItem>
</MenuContent>
```
