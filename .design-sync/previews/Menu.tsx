import { Download, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button, Menu, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuTrigger } from '@rivocode/ui'

export function AcoesDaLinha() {
  return (
    <div className="min-h-64">
      <Menu defaultOpen>
        <MenuTrigger render={<Button variant="secondary" size="icon" aria-label="Mais acoes" />}>
          <MoreHorizontal size={16} aria-hidden="true" />
        </MenuTrigger>
        <MenuContent>
          <MenuGroup label="Nota 4813">
            <MenuItem>
              <Download size={15} aria-hidden="true" />
              Baixar PDF
            </MenuItem>
            <MenuItem>Duplicar</MenuItem>
            <MenuItem>Enviar por email</MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem tone="danger">
            <Trash2 size={15} aria-hidden="true" />
            Cancelar nota
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  )
}

export function Fechado() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="secondary" size="sm" />}>Acoes</MenuTrigger>
      <MenuContent>
        <MenuItem>Baixar PDF</MenuItem>
        <MenuItem>Duplicar</MenuItem>
      </MenuContent>
    </Menu>
  )
}
