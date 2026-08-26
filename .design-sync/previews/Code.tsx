import { Code, CodeBlock } from '@rivocode/ui'

const RETORNO = `{
  "numero": "4813",
  "situacao": "autorizada",
  "chave": "35240612345678000199550010000048131234567890"
}`

/** Código na frase */
export function InlineCode() {
  return (
    <p className="max-w-96 text-base text-fg-muted">
      Instale a skill com <Code>npx rivocode-ui skill</Code> e ela aparece em{' '}
      <Code>.claude/skills</Code>.
    </p>
  )
}

/** Retorno da API */
export function ApiResponse() {
  return (
    <div className="w-96">
      <CodeBlock title="POST /notas" lineNumbers copyable>
        {RETORNO}
      </CodeBlock>
    </div>
  )
}
