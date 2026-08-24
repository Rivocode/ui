import { Alert, AlertDescription, AlertTitle } from '@rivocode/ui'

/** Tons */
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
