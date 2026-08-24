import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Menubar } from '@rivocode/ui'

export function Principal() {
  return (
    <Menubar aria-label="Principal">
      <Menu>
        <MenuTrigger className="rounded-sm px-2.5 py-1 text-base text-fg-muted hover:bg-accent-subtle">
          Arquivo
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Nova nota</MenuItem>
          <MenuItem>Abrir rascunho</MenuItem>
          <MenuSeparator />
          <MenuItem>Exportar XML</MenuItem>
        </MenuContent>
      </Menu>

      <Menu>
        <MenuTrigger className="rounded-sm px-2.5 py-1 text-base text-fg-muted hover:bg-accent-subtle">
          Editar
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Desfazer</MenuItem>
          <MenuItem>Duplicar</MenuItem>
        </MenuContent>
      </Menu>

      <Menu>
        <MenuTrigger className="rounded-sm px-2.5 py-1 text-base text-fg-muted hover:bg-accent-subtle">
          Exibir
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Modo compacto</MenuItem>
        </MenuContent>
      </Menu>
    </Menubar>
  )
}
