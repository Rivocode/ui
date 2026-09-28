import { Avatar, AvatarGroup } from '@rivocode/ui'

/** Who has access */
export function TeamAccess() {
  return (
    <AvatarGroup max={4}>
      <Avatar fallback="AP" />
      <Avatar fallback="CN" />
      <Avatar fallback="EB" />
      <Avatar fallback="MS" />
      <Avatar fallback="RT" />
      <Avatar fallback="JL" />
    </AvatarGroup>
  )
}
