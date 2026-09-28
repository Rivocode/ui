import { Alert, AlertDescription, AlertTitle } from '@rivocode/ui'
import { CheckCircle2, CircleX, Info, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

/** Tones */
export function Tones() {
  return (
    <div className="flex max-w-lg flex-col gap-3">
      <Alert tone="info">
        <AlertTitle>Prazo alterado</AlertTitle>
        <AlertDescription>A entrega passou de 12/09 para 19/09.</AlertDescription>
      </Alert>
      <Alert tone="success">
        <AlertTitle>Nota emitida</AlertTitle>
        <AlertDescription>O PDF foi enviado para o email do cliente.</AlertDescription>
      </Alert>
      <Alert tone="warning">
        <AlertTitle>Certificado vence em 8 dias</AlertTitle>
        <AlertDescription>Renove antes de 01/09 para não interromper a emissão.</AlertDescription>
      </Alert>
      <Alert tone="danger">
        <AlertTitle>Não foi possível carregar</AlertTitle>
        <AlertDescription>A prefeitura não respondeu. Tente de novo em alguns minutos.</AlertDescription>
      </Alert>
    </div>
  )
}

/** With icon */
export function WithIcon() {
  /*
   * Color is never the only signal: someone who cannot tell red from green
   * reads four identical boxes, and black-and-white printing has the same
   * problem. The slot guarantees the position: before the text, aligned with
   * the first line.
   */
  return (
    <div className="flex max-w-lg flex-col gap-3">
      <Alert tone="info" icon={<Info />}>
        <AlertTitle>Prazo alterado</AlertTitle>
        <AlertDescription>A entrega passou de 12/09 para 19/09.</AlertDescription>
      </Alert>
      <Alert tone="success" icon={<CheckCircle2 />}>
        <AlertTitle>Nota emitida</AlertTitle>
        <AlertDescription>O PDF foi enviado para o email do cliente.</AlertDescription>
      </Alert>
      <Alert tone="warning" icon={<TriangleAlert />}>
        <AlertTitle>Certificado vence em 8 dias</AlertTitle>
        <AlertDescription>Renove antes de 01/09 para não interromper a emissão.</AlertDescription>
      </Alert>
      <Alert tone="danger" icon={<CircleX />}>
        <AlertTitle>Não foi possível carregar</AlertTitle>
        <AlertDescription>A prefeitura não respondeu. Tente de novo em alguns minutos.</AlertDescription>
      </Alert>
    </div>
  )
}

/** Dismissible by the person */
export function Dismissible() {
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <p className="text-sm text-fg-muted">
        O aviso foi dispensado. Quem some com ele é quem chamou, não a peça.
      </p>
    )
  }

  return (
    <Alert
      tone="warning"
      icon={<TriangleAlert />}
      onDismiss={() => setOpen(false)}
      className="max-w-lg"
    >
      <AlertTitle>Certificado vence em 8 dias</AlertTitle>
      <AlertDescription>Renove antes de 01/09 para não interromper a emissão.</AlertDescription>
    </Alert>
  )
}
