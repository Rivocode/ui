import { Button, Spinner } from '@rivocode/ui'

export function Tamanhos() {
  return (
    <div className="flex items-center gap-4 text-fg-muted">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  )
}

export function DentroDeBotao() {
  return (
    <Button disabled>
      <Spinner size="sm" label="" />
      Emitindo nota
    </Button>
  )
}
