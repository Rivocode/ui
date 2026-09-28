import { Text } from '@rivocode/ui'

const MOTIVO =
  'Rejeitada pela prefeitura por divergência no código de serviço informado na emissão, e devolvida para correção manual depois de duas tentativas de reenvio no mesmo dia.'

/** Os tons */
export function Tones() {
  return (
    <div className="flex flex-col gap-1">
      <Text size="base" tone="neutral">
        Texto corrido, no tom neutro.
      </Text>
      <Text size="base" tone="muted">
        Texto secundário, que explica o de cima.
      </Text>
      <Text size="sm" tone="subtle">
        Legenda, atualizada há 2 minutos.
      </Text>
      <Text size="sm" tone="success">
        Nota autorizada.
      </Text>
      <Text size="sm" tone="warning">
        Certificado vence em 5 dias.
      </Text>
      <Text size="sm" tone="danger">
        Nota rejeitada.
      </Text>
      <Text size="sm" tone="info">
        Nova versão do layout da prefeitura.
      </Text>
    </div>
  )
}

/** Trecho dentro da frase */
export function Inline() {
  return (
    <Text size="base" tone="muted" className="max-w-96">
      O total do mês foi{' '}
      <Text render={<span />} tone="neutral" weight="semibold">
        R$ 48.310,00
      </Text>
      , e o trecho herda o corpo da frase.
    </Text>
  )
}

/** Cortar o que não cabe */
export function Clamp() {
  return (
    <div className="flex w-72 flex-col gap-3">
      <Text size="sm" truncate>
        {MOTIVO}
      </Text>
      <Text size="sm" tone="muted" lineClamp={2}>
        {MOTIVO}
      </Text>
    </div>
  )
}
