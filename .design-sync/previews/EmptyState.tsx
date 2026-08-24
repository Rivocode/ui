import { FileText, Search } from 'lucide-react'
import { Button, Card, EmptyState } from '@rivocode/ui'

export function PrimeiroUso() {
  return (
    <Card className="max-w-lg">
      <EmptyState
        icon={<FileText aria-hidden="true" />}
        title="Nenhuma nota por aqui"
        description="Quando voce emitir a primeira, ela aparece nesta lista."
        action={<Button size="sm">Emitir nota</Button>}
      />
    </Card>
  )
}

export function BuscaSemResultado() {
  return (
    <Card className="max-w-lg">
      <EmptyState
        icon={<Search aria-hidden="true" />}
        title="Nada encontrado para esse filtro"
        description="Tente ampliar o periodo ou limpar o filtro de status."
        action={<Button size="sm" variant="secondary">Limpar filtros</Button>}
      />
    </Card>
  )
}
