import { Card, CardContent, CardHeader, CardTitle } from '@rivocode/ui'
import { AILabel } from '@rivocode/ui/ai'

/** Selo */
export function Seal() {
  return (
    <div className="flex items-center gap-3">
      <AILabel />
      <AILabel tone="neutral" />
      <AILabel size="md" />
    </div>
  )
}

/** Com explicação */
export function WithExplanation() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Resumo de agosto</CardTitle>
          <AILabel explanation="Escrito pelo assistente da RivoCode a partir das 42 notas emitidas em agosto. Confira os valores na listagem antes de enviar ao contador." />
        </div>
      </CardHeader>
      <CardContent className="text-sm text-fg-muted">
        O faturamento subiu 12% sobre julho, puxado pelos serviços de consultoria. Três notas
        seguem em aberto.
      </CardContent>
    </Card>
  )
}
