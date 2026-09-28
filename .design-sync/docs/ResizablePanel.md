---
category: Structure
---

# ResizablePanel

One of the areas of a `ResizablePanelGroup`.

The sizes are percentages of the group: `defaultSize` is where it starts,
`minSize` and `maxSize` are the limits the divider respects. `collapsible`
lets the area collapse down to `collapsedSize`, and collapsed at 0 it leaves
the `Tab` order. The `ref` gives `collapse()`, `expand()`, `resize(size)`,
`getSize()` and `isCollapsed()`.
