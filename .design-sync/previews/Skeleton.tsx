import { Card, Skeleton } from '@rivocode/ui'

export function LinhasDeTabela() {
  return (
    <Card className="max-w-lg">
      <div className="flex flex-col gap-3 p-5" aria-busy="true">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-[18px] rounded-sm" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 rounded-pill" />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function Cartao() {
  return (
    <Card className="max-w-sm">
      <div className="flex flex-col gap-3 p-5" aria-busy="true">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
      </div>
    </Card>
  )
}
