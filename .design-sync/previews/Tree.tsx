import { Tree, type No } from '@rivocode/ui'

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
    label: 'Operação',
    children: [
      { id: 'expedicao', label: 'Expedição' },
      { id: 'estoque', label: 'Estoque' },
    ],
  },
]

/** Estado misto */
export function MixedState() {
  return (
    <div className="w-72">
      <Tree
        items={SETORES}
        selected={['contas-pagar']}
        onSelectedChange={() => {}}
        expanded={['financeiro', 'operacao']}
        multiple
      />
    </div>
  )
}
