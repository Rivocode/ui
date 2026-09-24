import { Banner, Button } from '@rivocode/ui'
import { Wrench } from 'lucide-react'
import { useState } from 'react'

/** Tons */
export function Tones() {
  return (
    <div className="flex flex-col gap-3">
      <Banner
        tone="info"
        title="Manutenção programada"
        description="A emissão de notas fica fora do ar domingo, 28/09, das 2h às 4h."
      />
      <Banner
        tone="success"
        description="Sua conta foi verificada. A emissão em produção está liberada."
      />
      <Banner
        tone="warning"
        title="Você está no modo de teste"
        description="As notas emitidas aqui não têm validade fiscal."
      />
      <Banner
        tone="danger"
        title="Fatura em atraso"
        description="A fatura de agosto venceu há 5 dias. A emissão será suspensa em 10/10."
      />
    </div>
  )
}

/** Com ações */
export function WithActions() {
  return (
    <Banner
      tone="danger"
      title="Fatura em atraso"
      description="A fatura de agosto venceu há 5 dias. A emissão será suspensa em 10/10."
      actions={
        <>
          <Button size="sm" variant="secondary">
            Ver fatura
          </Button>
          <Button size="sm" variant="secondary">
            Pagar com Pix
          </Button>
        </>
      }
    />
  )
}

/** Que a pessoa dispensa */
export function Dismissible() {
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <p className="text-sm text-fg-muted">
        A faixa foi dispensada. Quem some com ela é quem chamou, e não a peça.
      </p>
    )
  }

  return (
    <Banner
      tone="info"
      icon={<Wrench />}
      title="Manutenção programada"
      description="A emissão de notas fica fora do ar domingo, 28/09, das 2h às 4h."
      onDismiss={() => setOpen(false)}
    />
  )
}
