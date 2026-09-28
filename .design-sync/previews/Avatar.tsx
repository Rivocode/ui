import { Avatar } from '@rivocode/ui'

/** Tamanhos */
export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="sm" fallback="EB" />
      <Avatar fallback="CS" />
      <Avatar size="lg" fallback="RC" />
    </div>
  )
}
