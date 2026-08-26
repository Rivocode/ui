import { Avatar, AvatarGroup } from '@rivocode/ui'

/** Quem tem acesso */
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
