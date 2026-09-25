import {
  Button,
  Card,
  CardContent,
  Clipboard,
  DescriptionItem,
  DescriptionList,
  Heading,
  Link,
  Text,
} from '@rivocode/ui'
import { House, RotateCw, ServerCrash } from 'lucide-react'
import { useState } from 'react'

const INCIDENT = {
  reference: 'RC-7F3A-91C2',
  happenedAt: new Date('2026-09-24T14:32:08-03:00'),
}

const WHEN = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'medium',
  timeZone: 'America/Sao_Paulo',
})

export default function ServerErrorPage({
  onRetry = () => window.location.reload(),
}: {
  onRetry?: () => void | Promise<void>
}) {
  const [retrying, setRetrying] = useState(false)

  return (
    <div className="flex w-full justify-center bg-bg px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted">
            <ServerCrash size={24} aria-hidden="true" />
          </div>
          <Text size="sm" tone="subtle" className="font-mono">
            Erro 500
          </Text>
          <Heading level={1} size="2xl">
            Não conseguimos abrir esta página
          </Heading>
          <Text tone="muted">
            A falha foi no nosso servidor, e não em algo que você fez. A equipe já recebeu o aviso.
            Tente de novo em alguns instantes: o que você tinha salvo continua salvo.
          </Text>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            loading={retrying}
            onClick={async () => {
              setRetrying(true)
              const attempt = onRetry()
              if (attempt) {
                await attempt.catch(() => undefined)
                setRetrying(false)
              }
            }}
          >
            <RotateCw size={16} aria-hidden="true" />
            Tentar de novo
          </Button>
          <Button variant="secondary" render={<a href="/" />}>
            <House size={16} aria-hidden="true" />
            Ir para o início
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-3 py-[var(--rc-pad-panel)]">
            <Text size="sm" tone="muted">
              Se o erro continuar, mande este código ao suporte. É por ele que a equipe acha o que
              aconteceu com você.
            </Text>
            <DescriptionList>
              <DescriptionItem label="Código do atendimento">
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono text-fg">{INCIDENT.reference}</span>
                  <Clipboard
                    value={INCIDENT.reference}
                    size="sm"
                    variant="ghost"
                    labels={{ copy: 'Copiar o código', copied: 'Código copiado' }}
                  />
                </span>
              </DescriptionItem>
              <DescriptionItem label="Quando">
                <time dateTime={INCIDENT.happenedAt.toISOString()}>
                  {WHEN.format(INCIDENT.happenedAt)}
                </time>
              </DescriptionItem>
            </DescriptionList>
            <Link
              href={`mailto:suporte@exemplo.com.br?subject=Erro ${INCIDENT.reference}`}
              className="text-sm"
            >
              Escrever para o suporte com o código
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
