import { Affix, Button } from '@rivocode/ui'

const PARAGRAPHS = Array.from(
  { length: 12 },
  (_, index) =>
    `Cláusula ${index + 1}. O prestador emite a nota fiscal de serviço até o quinto dia útil ` +
    'do mês seguinte, com as retenções previstas no contrato e o código de serviço da prefeitura.',
)

/** Ação que acompanha a leitura */
export function FollowsReading() {
  return (
    <div className="relative">
      <div
        tabIndex={0}
        aria-label="Contrato de prestação de serviço"
        className="h-72 overflow-y-auto rounded-md border border-border bg-surface p-4 pb-20"
      >
        {PARAGRAPHS.map((text) => (
          <p key={text} className="mb-3 text-sm text-fg-muted">
            {text}
          </p>
        ))}
      </div>
      <Affix strategy="absolute" position={{ bottom: 16, right: 16 }}>
        <Button className="shadow-2">Assinar contrato</Button>
      </Affix>
    </div>
  )
}

/** Faixa grudada em cima */
export function TopStrip() {
  return (
    <div className="relative">
      <div
        tabIndex={0}
        aria-label="Rascunho da nota"
        className="h-60 overflow-y-auto rounded-md border border-border bg-surface p-4 pt-16"
      >
        {PARAGRAPHS.slice(0, 6).map((text) => (
          <p key={text} className="mb-3 text-sm text-fg-muted">
            {text}
          </p>
        ))}
      </div>
      <Affix
        strategy="absolute"
        position={{ top: 1, left: 1, right: 1 }}
        className="flex items-center justify-between gap-3 rounded-t-md border-b border-border bg-surface-raised px-4 py-2"
      >
        <span className="text-sm text-fg">Rascunho salvo às 14:32</span>
        <Button size="sm" variant="secondary">
          Emitir
        </Button>
      </Affix>
    </div>
  )
}
