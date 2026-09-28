import { RelativeTime, Timeline, TimelineItem } from '@rivocode/ui'

const AGORA = new Date('2026-08-25T18:00:00Z')

/** Trilha de uma nota */
export function InvoiceTrail() {
  return (
    <div className="w-96">
      <Timeline>
        <TimelineItem
          title="Emitida"
          tone="accent"
          by="Ana Prado"
          at={<RelativeTime value={new Date('2026-08-25T12:04:00Z')} now={AGORA} />}
        />
        <TimelineItem
          title="Autorizada pela prefeitura"
          tone="success"
          at={<RelativeTime value={new Date('2026-08-25T12:05:00Z')} now={AGORA} />}
        >
          Protocolo 2026.4813.99
        </TimelineItem>
        <TimelineItem
          title="Cancelada"
          tone="danger"
          by="Carlos Nunes"
          at={<RelativeTime value={new Date('2026-08-25T14:20:00Z')} now={AGORA} />}
        >
          Motivo: dados do destinatário incorretos
        </TimelineItem>
        <TimelineItem title="Substituição pendente" pending />
      </Timeline>
    </div>
  )
}
