import { IconButton } from '@rivocode/ui'
import { PromptInput } from '@rivocode/ui/ai'
import { Paperclip } from 'lucide-react'
import { useState } from 'react'

/** Enviar e parar */
export function SendAndStop() {
  const [streaming, setStreaming] = useState(false)

  return (
    <div className="w-full max-w-xl">
      <PromptInput
        placeholder="Pergunte sobre as notas desta conta"
        streaming={streaming}
        onSubmit={() => setStreaming(true)}
        onStop={() => setStreaming(false)}
      />
    </div>
  )
}

/** Com anexo e contador */
export function WithAttachmentAndCount() {
  return (
    <div className="w-full max-w-xl">
      <PromptInput
        defaultValue="Resuma a nota em anexo em três linhas."
        maxLength={4000}
        showCount
        attachments={
          <span className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-fg-muted">
            nota-agosto.pdf
          </span>
        }
        actions={
          <IconButton label="Anexar arquivo" variant="ghost" size="sm">
            <Paperclip />
          </IconButton>
        }
      />
    </div>
  )
}

/** Desabilitado */
export function Disabled() {
  return (
    <div className="w-full max-w-xl">
      <PromptInput disabled placeholder="O assistente está fora do ar até as 14h" />
    </div>
  )
}
