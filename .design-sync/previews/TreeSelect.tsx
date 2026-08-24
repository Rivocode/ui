import { TreeSelect, type TreeNode } from '@rivocode/ui'

const SETORES: TreeNode[] = [
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
    label: 'Operação',
    children: [{ id: 'expedicao', label: 'Expedição' }],
  },
]

/** Escolhido */
export function Selected() {
  return (
    <TreeSelect
      className="w-72"
      items={SETORES}
      defaultValue={['contas-pagar', 'contas-receber']}
      placeholder="Escolha os setores"
    />
  )
}

/** Vazio */
export function Empty() {
  return <TreeSelect className="w-72" items={SETORES} placeholder="Escolha os setores" />
}
