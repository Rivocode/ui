import { RelativeTime } from '@rivocode/ui'

const AGORA = new Date('2026-08-25T12:00:00Z')
const EVENTOS = [
  { label: 'Nota 4813 emitida', at: new Date('2026-08-25T11:58:30Z') },
  { label: 'Nota 4812 autorizada', at: new Date('2026-08-25T09:12:00Z') },
  { label: 'Lote enviado', at: new Date('2026-08-22T16:40:00Z') },
  { label: 'Certificado renovado', at: new Date('2026-02-11T10:00:00Z') },
]

/** Fila de eventos */
export function EventFeed() {
  return (
    <ul className="flex w-80 flex-col gap-2">
      {EVENTOS.map((evento) => (
        <li key={evento.label} className="flex items-baseline justify-between gap-4 text-base">
          <span className="min-w-0 truncate text-fg">{evento.label}</span>
          <RelativeTime
            value={evento.at}
            now={AGORA}
            cutoff="month"
            className="shrink-0 font-mono text-xs text-fg-subtle"
          />
        </li>
      ))}
    </ul>
  )
}
