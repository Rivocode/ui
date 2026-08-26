import { Columns3, Download, MoreHorizontal, SlidersHorizontal, Trash2 } from 'lucide-react'
import {
  Button,
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

/** Ações da linha */
export function RowActions() {
  return (
    <div className="min-h-64">
      <Menu defaultOpen /* rc-keep-open */>
        <MenuTrigger render={<Button variant="secondary" size="icon" aria-label="Mais ações" />}>
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

/** Fechado */
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

/** Quais colunas mostrar */
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
              /* O menu nao fecha ao marcar: quem escolhe colunas escolhe
                 varias de uma vez, e reabrir a cada clique era o preco do
                 Popover com Checkbox dentro. */
              <MenuCheckboxItem
                key={column.key}
                defaultChecked={column.key !== 'valor'}
                /* A coluna que identifica a linha nao se esconde: sem ela a
                   listagem vira uma tabela de valores sem dono. Desabilitado, e
                   nao ausente - sumir com a opcao esconde que ela existe. */
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

/** Ordenar por */
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
            {/* `closeOnClick` porque escolher a ordem encerra o assunto - na
                Base UI o padrao e o contrario, e o menu fica aberto. */}
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

/** Com submenu */
export function WithSubmenu() {
  return (
    <div className="min-h-64">
      <Menu defaultOpen /* rc-keep-open */>
        <MenuTrigger render={<Button variant="secondary" size="sm" />}>Nota 4813</MenuTrigger>
        <MenuContent>
          <MenuItem>Duplicar</MenuItem>
          <MenuSubmenu>
            {/* O lado nao se pede: o ramo abre em `inline-end` sozinho, e vira
                para o outro lado quando nao cabe. */}
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
