import { Badge, Button, DataTable, type Column } from '@rivocode/ui'

type Nota = { id: string; numero: string; cliente: string; valor: string; situacao: string }

const NOTAS: Nota[] = [
  { id: '1', numero: '4813', cliente: 'Clinica Sao Lucas', valor: 'R$ 2,5K', situacao: 'Paga' },
  { id: '2', numero: '4814', cliente: 'Transportes Cabo Branco', valor: 'R$ 940', situacao: 'Aberta' },
]

const COLUNAS: Column<Nota>[] = [
  { key: 'numero', header: 'Número' },
  { key: 'cliente', header: 'Cliente' },
  { key: 'valor', header: 'Valor', align: 'right' },
  {
    key: 'situacao',
    header: 'Situação',
    align: 'right',
    cell: (nota) => <Badge tone={nota.situacao === 'Paga' ? 'success' : 'neutral'}>{nota.situacao}</Badge>,
  },
]

/** Com dados */
export function WithData() {
  return (
    <DataTable
      data={NOTAS}
      columns={COLUNAS}
      rowKey={(nota) => nota.id}
      empty={{ title: 'Nenhuma nota', description: 'Emita a primeira para ela aparecer.' }}
    />
  )
}

/** Carregando */
export function Loading() {
  return <DataTable<Nota> data={undefined} columns={COLUNAS} rowKey={(nota) => nota.id} skeletonRows={3} />
}

/** Erro */
export function Error() {
  return (
    <DataTable<Nota>
      data={undefined}
      isError
      onRetry={() => {}}
      errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
      columns={COLUNAS}
      rowKey={(nota) => nota.id}
    />
  )
}

/** Vazio */
export function Empty() {
  return (
    <DataTable<Nota>
      data={[]}
      columns={COLUNAS}
      rowKey={(nota) => nota.id}
      empty={{
        title: 'Nenhuma nota por aqui',
        description: 'Quando você emitir a primeira, ela aparece nesta lista.',
        action: <Button size="sm">Emitir nota</Button>,
      }}
    />
  )
}
