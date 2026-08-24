import { useEffect, useRef } from 'react'
import { useToast } from '@rivocode/ui'

/**
 * O ToastViewport já e montado pelo RivoProvider. Não se usa direto: o que a
 * aplicação faz e chamar `useToast().add(...)`, e o aviso aparece aqui.
 */
function Aviso({ title, description }: { title: string; description: string }) {
  const toast = useToast()
  const disparado = useRef(false)

  useEffect(() => {
    if (disparado.current) return
    disparado.current = true
    toast.add({ title, description, timeout: 0 })
  }, [toast, title, description])

  return null
}

/** Aviso de sucesso */
export function SuccessNotice() {
  return (
    <div className="min-h-40">
      <p className="text-base text-fg-muted">
        Chame `useToast().add(...)` e o aviso aparece no canto, sem a aplicação
        montar portal nenhum.
      </p>
      <Aviso
        title="Nota 4816 emitida"
        description="O PDF foi enviado para o email do cliente."
      />
    </div>
  )
}
