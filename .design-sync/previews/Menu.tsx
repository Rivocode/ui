import { Columns3, Download, MoreHorizontal, SlidersHorizontal, Trash2 } from 'lucide-react'
import {
  Button,
  IconButton,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSubmenu,
  MenuSubmenuTrigger,
  MenuTrigger,
} from '@rivocode/ui'

const COLUMNS = [
  { key: 'numero', label: 'Número' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'emissao', label: 'Emissão' },
  { key: 'valor', label: 'Valor' },
]

/** Row actions */
export function RowActions() {
  return (
    <div className="min-h-64">
      <Menu defaultOpen /* rc-keep-open */>
        <MenuTrigger
          render={
            <IconButton variant="secondary" label="Mais ações">
              <MoreHorizontal size={16} aria-hidden="true" />
            </IconButton>
          }
        />
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

/** Closed */
export function ClosedState() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="secondary" size="sm" />}>Ações</MenuTrigger>
      <MenuContent>
        <MenuItem>Baixar PDF</MenuItem>
        <MenuItem>Duplicar</MenuItem>
      </MenuContent>
    </Menu>
  )
}

/** Which columns to show */
export function ColumnPicker() {
  return (
    <div className="min-h-72">
      <Menu defaultOpen /* rc-keep-open */>
        <MenuTrigger render={<Button variant="secondary" size="sm" />}>
          <Columns3 size={15} aria-hidden="true" />
          Colunas
        </MenuTrigger>
        <MenuContent>
          <MenuGroup label="Mostrar na listagem">
            {COLUMNS.map((column) => (
              /* The menu does not close on check: whoever picks columns picks
                 several at once, and reopening on every click was the price
                 of a Popover with Checkboxes inside. */
              <MenuCheckboxItem
                key={column.key}
                defaultChecked={column.key !== 'valor'}
                /* The column that identifies the row cannot be hidden: without it
                   the listing becomes a table of values with no owner.
                   Disabled, not absent - removing the option hides that it
                   exists. */
                disabled={column.key === 'numero'}
              >
                {column.label}
              </MenuCheckboxItem>
            ))}
          </MenuGroup>
        </MenuContent>
      </Menu>
    </div>
  )
}

/** Sort by */
export function SortChoice() {
  return (
    <div className="min-h-72">
      <Menu defaultOpen /* rc-keep-open */>
        <MenuTrigger render={<Button variant="secondary" size="sm" />}>
          <SlidersHorizontal size={15} aria-hidden="true" />
          Ordenar
        </MenuTrigger>
        <MenuContent>
          <MenuRadioGroup defaultValue="emissao" label="Ordenar por">
            {/* `closeOnClick` because choosing the order settles the matter - in
                Base UI the default is the opposite, and the menu stays open. */}
            <MenuRadioItem value="emissao" closeOnClick>
              Data de emissão
            </MenuRadioItem>
            <MenuRadioItem value="valor" closeOnClick>
              Valor
            </MenuRadioItem>
            <MenuRadioItem value="cliente" closeOnClick>
              Cliente
            </MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    </div>
  )
}

/** With submenu */
export function WithSubmenu() {
  return (
    <div className="min-h-64">
      <Menu defaultOpen /* rc-keep-open */>
        <MenuTrigger render={<Button variant="secondary" size="sm" />}>Nota 4813</MenuTrigger>
        <MenuContent>
          <MenuItem>Duplicar</MenuItem>
          <MenuSubmenu>
            {/* The side is not requested: the branch opens at `inline-end` on its
                own, and flips to the other side when it does not fit. */}
            <MenuSubmenuTrigger>Exportar</MenuSubmenuTrigger>
            <MenuContent>
              <MenuItem>XML da NF-e</MenuItem>
              <MenuItem>PDF do DANFE</MenuItem>
              <MenuItem>Planilha CSV</MenuItem>
            </MenuContent>
          </MenuSubmenu>
          <MenuSeparator />
          <MenuItem tone="danger">Cancelar nota</MenuItem>
        </MenuContent>
      </Menu>
    </div>
  )
}
