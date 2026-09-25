import {
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from '@rivocode/ui'
import { ChevronDown, Grid2x2, List, Rows3 } from 'lucide-react'

/** Ação com variantes */
export function SplitAction() {
  return (
    <ButtonGroup>
      <Button>Emitir nota</Button>
      <Menu>
        <MenuTrigger
          render={
            <IconButton variant="primary" label="Outras formas de emitir">
              <ChevronDown size={16} />
            </IconButton>
          }
        />
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
      <IconButton variant="secondary" label="Ver em lista">
        <List size={16} />
      </IconButton>
      <IconButton variant="secondary" label="Ver em linhas">
        <Rows3 size={16} />
      </IconButton>
      <IconButton variant="secondary" label="Ver em grade">
        <Grid2x2 size={16} />
      </IconButton>
    </ButtonGroup>
  )
}
