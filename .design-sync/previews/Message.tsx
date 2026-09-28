import { Avatar } from '@rivocode/ui'
import { Message } from '@rivocode/ui/ai'

const ANSWER =
  'Em agosto foram emitidas 42 notas, somando R$ 48.200,00. Três ainda estão em aberto, e a maior delas vence na sexta.'

/** Os três papéis */
export function Roles() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Message role="system">Conversa iniciada às 14h02.</Message>
      <Message role="user">Quanto faturei em agosto?</Message>
      <Message
        role="assistant"
        avatar={<Avatar size="sm" fallback="R" />}
        copyValue={ANSWER}
        onRetry={() => {}}
      >
        {ANSWER}
      </Message>
    </div>
  )
}

/** Chegando */
export function Streaming() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Message role="assistant" avatar={<Avatar size="sm" fallback="R" />} streaming>
        Em agosto foram emitidas 42 notas
      </Message>
      <Message role="assistant" avatar={<Avatar size="sm" fallback="R" />} streaming />
    </div>
  )
}

/** Com erro */
export function WithError() {
  return (
    <div className="w-full max-w-xl">
      <Message
        role="assistant"
        avatar={<Avatar size="sm" fallback="R" />}
        error="A resposta foi interrompida. Tente de novo."
        onRetry={() => {}}
      >
        Em agosto foram emitidas
      </Message>
    </div>
  )
}
