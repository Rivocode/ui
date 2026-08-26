import { Clipboard, Code } from '@rivocode/ui'

const CHAVE = '35240612345678000199550010000048131234567890'

/** Copiar a chave de acesso */
export function CopyAccessKey() {
  return (
    <div className="flex w-96 items-center gap-2">
      <Code className="min-w-0 flex-1 truncate">{CHAVE}</Code>
      <Clipboard value={CHAVE} />
    </div>
  )
}

/** Com texto ao lado */
export function WithLabel() {
  return <Clipboard value="00020126580014br.gov.bcb.pix">Copiar código Pix</Clipboard>
}
