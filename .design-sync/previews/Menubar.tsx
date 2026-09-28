import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  Menubar,
  MenubarTrigger,
} from '@rivocode/ui'

/** Main */
export function Primary() {
  return (
    <Menubar aria-label="Principal">
      <Menu>
        {/* The bar's trigger is the `MenubarTrigger`, not a `MenuTrigger` with
            hand-written classes: the five classes repeated here were its skin
            copied over, and the copy came without the focus ring - the bar
            published in the documentation was the only component in the
            catalog that lost sight of focus. Whoever reads the example copies
            the example. */}
        <MenubarTrigger>Arquivo</MenubarTrigger>
        <MenuContent>
          <MenuItem>Nova nota</MenuItem>
          <MenuItem>Abrir rascunho</MenuItem>
          <MenuSeparator />
          <MenuItem>Exportar XML</MenuItem>
        </MenuContent>
      </Menu>

      <Menu>
        <MenubarTrigger>Editar</MenubarTrigger>
        <MenuContent>
          <MenuItem>Desfazer</MenuItem>
          <MenuItem>Duplicar</MenuItem>
        </MenuContent>
      </Menu>

      <Menu>
        <MenubarTrigger>Exibir</MenubarTrigger>
        <MenuContent>
          <MenuItem>Modo compacto</MenuItem>
        </MenuContent>
      </Menu>
    </Menubar>
  )
}
