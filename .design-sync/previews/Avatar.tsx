import { Avatar } from '@rivocode/ui'

/** Sizes */
export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="sm" fallback="EB" />
      <Avatar fallback="CS" />
      <Avatar size="lg" fallback="RC" />
    </div>
  )
}
