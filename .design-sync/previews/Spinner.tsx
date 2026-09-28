import { Button, Spinner } from '@rivocode/ui'

/** Sizes */
export function Sizes() {
  return (
    <div className="flex items-center gap-4 text-fg">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  )
}

/** Inside a button */
export function InsideAButton() {
  return (
    <Button disabled>
      <Spinner size="sm" label="" />
      Emitindo nota
    </Button>
  )
}
