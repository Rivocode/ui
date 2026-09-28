import { TransferList, type TransferListItem } from '@rivocode/ui'
import { useState } from 'react'

const PERMISSIONS: TransferListItem[] = [
  { value: 'notas.emitir', label: 'Emitir nota fiscal' },
  { value: 'notas.cancelar', label: 'Cancelar nota fiscal' },
  { value: 'boletos.emitir', label: 'Emitir boleto' },
  { value: 'boletos.baixar', label: 'Dar baixa em boleto' },
  { value: 'relatorios.ver', label: 'Ver relatórios' },
  { value: 'relatorios.exportar', label: 'Exportar relatórios' },
  { value: 'usuarios.convidar', label: 'Convidar usuário' },
  { value: 'conta.excluir', label: 'Excluir a conta', disabled: true },
]

/** As permissões de um papel */
export function Permissions() {
  const [granted, setGranted] = useState<string[]>(['relatorios.ver'])

  return (
    <TransferList
      items={PERMISSIONS}
      value={granted}
      onValueChange={setGranted}
      labels={{ available: 'Permissões', chosen: 'Concedidas' }}
      className="w-full"
    />
  )
}

const CITIES: TransferListItem[] = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'bh', label: 'Belo Horizonte' },
  { value: 'jp', label: 'João Pessoa' },
  { value: 'rec', label: 'Recife' },
  { value: 'for', label: 'Fortaleza' },
  { value: 'poa', label: 'Porto Alegre' },
  { value: 'cwb', label: 'Curitiba' },
  { value: 'mao', label: 'Manaus' },
  { value: 'bel', label: 'Belém' },
]

/** Cidades de entrega, com busca sem acento */
export function Cities() {
  const [cities, setCities] = useState<string[]>([])

  return (
    <TransferList items={CITIES} value={cities} onValueChange={setCities} className="w-full" />
  )
}

/** Desabilitada */
export function Disabled() {
  return (
    <TransferList
      items={CITIES.slice(0, 4)}
      value={['jp']}
      onValueChange={() => {}}
      disabled
      searchable={false}
      className="w-full"
    />
  )
}
