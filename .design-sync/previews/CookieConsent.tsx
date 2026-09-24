import { Button, CookieConsent, type CookieChoice } from '@rivocode/ui'
import { useState } from 'react'

/** Aceitar, recusar ou personalizar */
export function Decide() {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<CookieChoice | null>(null)

  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Preferências de cookies
      </Button>
      <p className="text-sm text-fg-muted">
        {choice
          ? `Última escolha: ${Object.entries(choice.categories)
              .filter(([, accepted]) => accepted)
              .map(([id]) => id)
              .join(', ')}.`
          : 'Nenhuma escolha ainda.'}
      </p>
      <CookieConsent
        open={open}
        policyHref="/privacidade"
        defaultValue={choice?.categories}
        onDecision={(next) => {
          setChoice(next)
          setOpen(false)
        }}
      />
    </div>
  )
}

/** Categorias próprias */
export function OwnCategories() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Abrir o aviso
      </Button>
      <CookieConsent
        open={open}
        policyHref="/privacidade"
        title="Sua privacidade"
        description="O emissor usa cookies para manter você conectado e, se você deixar, para medir o uso e abrir o chat de suporte."
        categories={[
          {
            id: 'necessary',
            label: 'Necessários',
            description: 'Sessão, segurança e esta escolha.',
            required: true,
          },
          {
            id: 'analytics',
            label: 'Análise',
            description: 'Quais telas são usadas, sem identificar você.',
          },
          {
            id: 'support',
            label: 'Chat de suporte',
            description: 'O balão de conversa no canto da tela.',
          },
        ]}
        onDecision={() => setOpen(false)}
      />
    </div>
  )
}
