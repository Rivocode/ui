import {
  Badge,
  Button,
  Card,
  CardContent,
  DescriptionItem,
  DescriptionList,
  Heading,
  Link,
  Text,
} from '@rivocode/ui'
import { Wrench } from 'lucide-react'

const WINDOW = {
  start: new Date('2026-09-28T02:00:00-03:00'),
  end: new Date('2026-09-28T06:00:00-03:00'),
  statusPage: 'https://status.exemplo.com.br',
}

const DAY = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'America/Sao_Paulo',
})

const HOUR = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

export default function MaintenancePage() {
  return (
    <div className="flex w-full justify-center bg-bg px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted">
            <Wrench size={24} aria-hidden="true" />
          </div>
          <Badge tone="warning">Manutenção programada</Badge>
          <Heading level={1} size="2xl">
            Estamos atualizando o sistema
          </Heading>
          <Text tone="muted">
            A emissão e a consulta de notas voltam às{' '}
            <time dateTime={WINDOW.end.toISOString()}>{HOUR.format(WINDOW.end)}</time>. Nada do que
            você já emitiu foi perdido, e os rascunhos continuam onde você os deixou.
          </Text>
        </div>

        <Card>
          <CardContent className="py-[var(--rc-pad-panel)]">
            <DescriptionList>
              <DescriptionItem label="Dia">
                <time dateTime={WINDOW.start.toISOString()} className="first-letter:uppercase">
                  {DAY.format(WINDOW.start)}
                </time>
              </DescriptionItem>
              <DescriptionItem label="Horário">
                <span className="font-mono">
                  {HOUR.format(WINDOW.start)} às {HOUR.format(WINDOW.end)}
                </span>{' '}
                <span className="text-fg-muted">(horário de Brasília)</span>
              </DescriptionItem>
              <DescriptionItem label="O que para">
                Emissão, cancelamento e consulta de notas, e o acesso ao painel
              </DescriptionItem>
              <DescriptionItem label="O que continua">
                Os boletos já enviados seguem valendo, e o Pix continua caindo na conta
              </DescriptionItem>
            </DescriptionList>
          </CardContent>
        </Card>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button render={<a href={WINDOW.statusPage} />}>Acompanhar na página de status</Button>
          <Link href="mailto:suporte@exemplo.com.br" className="text-sm">
            Precisa emitir uma nota com urgência? Fale com o suporte
          </Link>
        </div>
      </div>
    </div>
  )
}
