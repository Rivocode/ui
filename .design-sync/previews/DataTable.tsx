import { Badge, Button, DataTable, type Coluna } from '@rivocode/ui'

type Nota = { id: string; numero: string; cliente: string; valor: string; situacao: string }

const NOTAS: Nota[] = [
  { id: '1', numero: '4813', cliente: 'Clinica Sao Lucas', valor: 'R$ 2.480,00', situacao: 'Paga' },
  { id: '2', numero: '4814', cliente: 'Transportes Cabo Branco', valor: 'R$ 940,00', situacao: 'Aberta' },
]

const COLUNAS: Coluna<Nota>[] = [
  { key: 'numero', header: 'Numero' },
  { key: 'cliente', header: 'Cliente' },
  { key: 'valor', header: 'Valor', align: 'right' },
  {
    key: 'situacao',
    header: 'Situacao',
    align: 'right',
    cell: (nota) => <Badge tone={nota.situacao === 'Paga' ? 'success' : 'neutral'}>{nota.situacao}</Badge>,
  },
]

export function ComDados() {
  return (
    <DataTable
      data={NOTAS}
      columns={COLUNAS}
      rowKey={(nota) => nota.id}
      empty={{ title: 'Nenhuma nota', description: 'Emita a primeira para ela aparecer.' }}
    />
  )
}

export function Carregando() {
  return <DataTable<Nota> data={undefined} columns={COLUNAS} rowKey={(nota) => nota.id} skeletonRows={3} />
}

export function Erro() {
  return (
    <DataTable<Nota>
      data={undefined}
      isError
      onRetry={() => {}}
      errorMessage="A prefeitura nao respondeu. Tente de novo em alguns minutos."
      columns={COLUNAS}
      rowKey={(nota) => nota.id}
    />
  )
}

export function Vazio() {
  return (
    <DataTable<Nota>
      data={[]}
      columns={COLUNAS}
      rowKey={(nota) => nota.id}
      empty={{
        title: 'Nenhuma nota por aqui',
        description: 'Quando voce emitir a primeira, ela aparece nesta lista.',
        action: <Button size="sm">Emitir nota</Button>,
      }}
    />
  )
}
