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
    label: 'Operacao',
    children: [
      { id: 'expedicao', label: 'Expedicao' },
      { id: 'estoque', label: 'Estoque' },
    ],
  },
]

export function EstadoMisto() {
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
