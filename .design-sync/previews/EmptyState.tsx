import { FileText, Search } from 'lucide-react'
import { Button, Card, EmptyState } from '@rivocode/ui'

/** Primeiro uso */
export function FirstRun() {
  return (
    <Card className="max-w-lg">
      <EmptyState
        icon={<FileText aria-hidden="true" />}
        title="Nenhuma nota por aqui"
        description="Quando você emitir a primeira, ela aparece nesta lista."
        action={<Button size="sm">Emitir nota</Button>}
      />
    </Card>
  )
}

/** Busca sem resultado */
export function SearchWithNoResult() {
  return (
    <Card className="max-w-lg">
      <EmptyState
        icon={<Search aria-hidden="true" />}
        title="Nada encontrado para esse filtro"
        description="Tente ampliar o período ou limpar o filtro de status."
        action={<Button size="sm" variant="secondary">Limpar filtros</Button>}
      />
    </Card>
  )
}

/** Primeira vez, com ilustração */
export function FirstRunIllustration() {
  return (
    <Card className="max-w-lg">
      <EmptyState
        illustration={
          <svg viewBox="0 0 120 80" className="h-20 w-auto">
            <rect x="20" y="10" width="80" height="60" rx="8" className="fill-accent-subtle" />
            <path
              d="M36 32h48M36 44h32M36 56h20"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        }
        title="Nenhuma nota por aqui"
        description="Quando você emitir a primeira, ela aparece nesta lista."
        action={<Button size="sm">Emitir nota</Button>}
      />
    </Card>
  )
}
