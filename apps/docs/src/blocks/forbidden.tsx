import {
  Alert,
  AlertDescription,
  AlertTitle,
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
import { House, LockKeyhole, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const ACCESS = {
  area: 'Faturamento',
  account: 'ana.ribeiro@clinicasaolucas.com.br',
  role: 'Atendimento',
  admin: 'Marina Costa',
}

export default function ForbiddenPage() {
  const [requested, setRequested] = useState(false)
  const confirmation = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (requested) confirmation.current?.focus()
  }, [requested])

  return (
    <div className="flex w-full justify-center bg-bg px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted">
            <LockKeyhole size={24} aria-hidden="true" />
          </div>
          <Text size="sm" tone="subtle" className="font-mono">
            Erro 403
          </Text>
          <Heading level={1} size="2xl">
            Você não tem acesso ao {ACCESS.area}
          </Heading>
          <Text tone="muted">
            Quem libera esta área é quem administra a conta da empresa. Peça o acesso e continue
            pelo que você já pode ver enquanto isso.
          </Text>
        </div>

        <Card>
          <CardContent className="py-[var(--rc-pad-panel)]">
            <DescriptionList>
              <DescriptionItem label="Sua conta">
                <span className="break-all">{ACCESS.account}</span>
              </DescriptionItem>
              <DescriptionItem label="Seu perfil">
                <Badge size="sm">{ACCESS.role}</Badge>
              </DescriptionItem>
              <DescriptionItem label="Quem libera">{ACCESS.admin}, administradora</DescriptionItem>
            </DescriptionList>
          </CardContent>
        </Card>

        {requested && (
          <div
            ref={confirmation}
            tabIndex={-1}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Alert tone="success">
              <AlertTitle>Pedido enviado para {ACCESS.admin}</AlertTitle>
              <AlertDescription>
                Você recebe um e-mail quando o acesso ao {ACCESS.area} for liberado. Não precisa
                pedir de novo.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={requested} onClick={() => setRequested(true)}>
            <Send size={16} aria-hidden="true" />
            {requested ? 'Acesso pedido' : 'Pedir acesso'}
          </Button>
          <Button variant="secondary" render={<a href="/" />}>
            <House size={16} aria-hidden="true" />
            Ir para o início
          </Button>
        </div>

        <Text size="sm" tone="muted">
          Entrou com a conta errada? <Link href="/sair">Entrar com outra conta</Link>
        </Text>
      </div>
    </div>
  )
}
