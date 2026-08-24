import { ContextMenu, ContextMenuTrigger, MenuContent, MenuItem, MenuSeparator } from '@rivocode/ui'

/** Na linha da tabela */
export function InATableRow() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-24 w-80 items-center justify-center rounded-md border border-dashed border-border text-base text-fg-muted">
        Clique com o botão direito
      </ContextMenuTrigger>
      <MenuContent>
        <MenuItem>Baixar PDF</MenuItem>
        <MenuItem>Duplicar</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger">Cancelar nota</MenuItem>
      </MenuContent>
    </ContextMenu>
  )
}
