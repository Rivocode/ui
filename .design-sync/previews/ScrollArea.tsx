import { ScrollArea } from '@rivocode/ui'

/** Lista longa */
export function LongList() {
  return (
    <ScrollArea className="h-40 w-80 rounded-md border border-border p-3">
      <div className="flex flex-col gap-2 text-base text-fg-muted">
        {Array.from({ length: 14 }, (_, indice) => (
          <p key={indice}>Nota {4800 + indice}, emitida e enviada por email.</p>
        ))}
      </div>
    </ScrollArea>
  )
}
