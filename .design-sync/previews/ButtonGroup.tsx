import { Button, ButtonGroup, Menu, MenuContent, MenuItem, MenuTrigger } from '@rivocode/ui'
import { ChevronDown, Grid2x2, List, Rows3 } from 'lucide-react'

/** Ação com variantes */
export function SplitAction() {
  return (
    <ButtonGroup>
      <Button>Emitir nota</Button>
      <Menu>
        <MenuTrigger
          render={<Button variant="primary" size="icon" aria-label="Outras formas de emitir" />}
        >
          <ChevronDown size={16} />
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Emitir e enviar por e-mail</MenuItem>
          <MenuItem>Emitir e baixar o PDF</MenuItem>
          <MenuItem>Emitir em lote</MenuItem>
        </MenuContent>
      </Menu>
    </ButtonGroup>
  )
}

/** Só ícones */
export function IconsOnly() {
  return (
    <ButtonGroup>
      <Button variant="secondary" size="icon" aria-label="Ver em lista">
        <List size={16} />
      </Button>
      <Button variant="secondary" size="icon" aria-label="Ver em linhas">
        <Rows3 size={16} />
      </Button>
      <Button variant="secondary" size="icon" aria-label="Ver em grade">
        <Grid2x2 size={16} />
      </Button>
    </ButtonGroup>
  )
}
