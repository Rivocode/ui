import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@rivocode/ui'

/** Formatação */
export function Formatting() {
  return (
    <Toolbar aria-label="Formatação">
      <ToolbarGroup>
        <ToolbarButton>Negrito</ToolbarButton>
        <ToolbarButton>Itálico</ToolbarButton>
        <ToolbarButton>Sublinhado</ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarButton>Limpar formato</ToolbarButton>
    </Toolbar>
  )
}
