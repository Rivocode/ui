import { Avatar } from '@rivocode/ui'
import { Conversation, Message, PromptInput } from '@rivocode/ui/ai'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'

type Turn = { id: number; role: 'user' | 'assistant'; text: string }

const HISTORY: Turn[] = [
  { id: 1, role: 'user', text: 'Quanto faturei em agosto?' },
  {
    id: 2,
    role: 'assistant',
    text: 'Em agosto foram emitidas 42 notas, somando R$ 48.200,00. Três ainda estão em aberto.',
  },
  { id: 3, role: 'user', text: 'Quais estão em aberto?' },
  {
    id: 4,
    role: 'assistant',
    text: 'A 1.204 da Clínica São Lucas, de R$ 3.400,00; a 1.211 da Padaria Pão Nosso, de R$ 780,00; e a 1.215 da Ótica Visão, de R$ 1.150,00.',
  },
  { id: 5, role: 'user', text: 'Qual vence primeiro?' },
  {
    id: 6,
    role: 'assistant',
    text: 'A da Clínica São Lucas, na sexta-feira. As outras duas vencem no dia 15.',
  },
]

/** Com histórico */
export function WithHistory() {
  const [turns, setTurns] = useState(HISTORY)

  return (
    <div className="flex h-[28rem] w-full max-w-xl flex-col gap-3">
      <Conversation className="flex-1">
        {turns.map((turn) => (
          <Message
            key={turn.id}
            role={turn.role}
            avatar={turn.role === 'assistant' ? <Avatar size="sm" fallback="R" /> : undefined}
          >
            {turn.text}
          </Message>
        ))}
      </Conversation>
      <PromptInput
        onSubmit={(text) =>
          setTurns((current) => [...current, { id: current.length + 1, role: 'user', text }])
        }
      />
    </div>
  )
}

/** Vazia, com sugestões */
export function EmptyWithSuggestions() {
  const [asked, setAsked] = useState<string | null>(null)

  return (
    <div className="flex h-80 w-full max-w-xl flex-col">
      <Conversation
        className="flex-1"
        empty={{
          icon: <MessageSquare />,
          title: 'Pergunte sobre as suas notas',
          description: 'O assistente lê as notas emitidas nesta conta, e nada além delas.',
          suggestions: ['Quanto faturei em agosto?', 'Quais notas vencem esta semana?'],
        }}
        onSuggestion={setAsked}
      >
        {asked && <Message role="user">{asked}</Message>}
      </Conversation>
    </div>
  )
}
