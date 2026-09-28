import { Tree, type TreeNode } from '@rivocode/ui'

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
    children: [
      { id: 'expedicao', label: 'Expedição' },
      { id: 'estoque', label: 'Estoque' },
    ],
  },
]

/** Mixed state */
export function MixedState() {
  return (
    <div className="w-72">
      <Tree
        items={SETORES}
        defaultValue={['contas-pagar']}
        defaultOpen={['financeiro', 'operacao']}
        multiple
      />
    </div>
  )
}
