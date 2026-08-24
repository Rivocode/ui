import { Separator } from '@rivocode/ui'

/** Horizontal */
export function Horizontal() {
  return (
    <div className="w-80">
      <p className="pb-3 text-base text-fg">Dados da nota</p>
      <Separator />
      <p className="pt-3 text-base text-fg-muted">Emitida em 05/08, vence em 20/08.</p>
    </div>
  )
}

/** Vertical */
export function Vertical() {
  return (
    <div className="flex h-6 items-center gap-3 text-sm text-fg-muted">
      <span>4813</span>
      <Separator orientation="vertical" />
      <span>Clínica São Lucas</span>
      <Separator orientation="vertical" />
      <span>R$ 2,5K</span>
    </div>
  )
}
