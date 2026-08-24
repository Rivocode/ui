import { Alert, AlertDescription, AlertTitle } from '@rivocode/ui'

export function Tons() {
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
        <AlertDescription>Renove antes de 01/09 para nao interromper a emissao.</AlertDescription>
      </Alert>
      <Alert tone="danger">
        <AlertTitle>Nao foi possivel carregar</AlertTitle>
        <AlertDescription>A prefeitura nao respondeu. Tente de novo em alguns minutos.</AlertDescription>
      </Alert>
    </div>
  )
}
