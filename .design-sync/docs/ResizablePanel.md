---
category: Estrutura
---

# ResizablePanel

Uma das áreas de um `ResizablePanelGroup`.

As medidas são porcentagem do grupo: `defaultSize` é onde ela começa,
`minSize` e `maxSize` são os limites que a divisória respeita. `collapsible`
deixa a área recolher até o `collapsedSize`, e recolhida em 0 ela sai do `Tab`.
O `ref` dá `collapse()`, `expand()`, `resize(size)`, `getSize()` e
`isCollapsed()`.
