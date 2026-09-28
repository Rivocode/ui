import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  Menubar,
  MenubarTrigger,
} from '@rivocode/ui'

/** Principal */
export function Primary() {
  return (
    <Menubar aria-label="Principal">
      <Menu>
        {/* O gatilho da barra e o `MenubarTrigger`, e nao um `MenuTrigger` com
            classe na mao: as cinco classes repetidas aqui eram a pele dele
            copiada, e a copia vinha sem o anel de foco - a barra publicada na
            documentacao era a unica peca do catalogo que perdia o foco de
            vista. Quem le o exemplo copia o exemplo. */}
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
