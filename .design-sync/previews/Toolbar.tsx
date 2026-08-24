import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@rivocode/ui'

export function Formatacao() {
  return (
    <Toolbar aria-label="Formatacao">
      <ToolbarGroup>
        <ToolbarButton>Negrito</ToolbarButton>
        <ToolbarButton>Italico</ToolbarButton>
        <ToolbarButton>Sublinhado</ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarButton>Limpar formato</ToolbarButton>
    </Toolbar>
  )
}
