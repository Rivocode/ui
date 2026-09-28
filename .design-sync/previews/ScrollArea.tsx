import { ScrollArea } from '@rivocode/ui'

/** Lista longa */
export function LongList() {
  return (
    <ScrollArea className="h-40 w-80 rounded-md border border-border p-3">
      <div className="flex flex-col gap-2 text-base text-fg-muted">
        {Array.from({ length: 14 }, (_, index) => (
          <p key={index}>Nota {4800 + index}, emitida e enviada por email.</p>
        ))}
      </div>
    </ScrollArea>
  )
}
