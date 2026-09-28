import { Button, Spinner } from '@rivocode/ui'

/** Tamanhos */
export function Sizes() {
  return (
    <div className="flex items-center gap-4 text-fg">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  )
}

/** Dentro de botão */
export function InsideAButton() {
  return (
    <Button disabled>
      <Spinner size="sm" label="" />
      Emitindo nota
    </Button>
  )
}
