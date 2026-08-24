import { TreeSelect, type No } from '@rivocode/ui'

const SETORES: No[] = [
  {
    id: 'financeiro',
    label: 'Financeiro',
    children: [
      { id: 'contas-pagar', label: 'Contas a pagar' },
      { id: 'contas-receber', label: 'Contas a receber' },
    ],
  },
  {
    id: 'operacao',
    label: 'Operacao',
    children: [{ id: 'expedicao', label: 'Expedicao' }],
  },
]

export function Escolhido() {
  return (
    <TreeSelect
      className="w-72"
      items={SETORES}
      defaultValue={['contas-pagar', 'contas-receber']}
      placeholder="Escolha os setores"
    />
  )
}

export function Vazio() {
  return <TreeSelect className="w-72" items={SETORES} placeholder="Escolha os setores" />
}
