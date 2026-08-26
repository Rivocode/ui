import { Button, useToast } from '@rivocode/ui'

/** Aviso de sucesso */
export function SuccessNotice() {
  const toast = useToast()

  return (
    <div className="flex min-h-40 flex-col items-start gap-3">
      <p className="text-base text-fg-muted">
        A área de avisos já vem montada pelo RivoProvider. A aplicação só chama o
        gancho.
      </p>
      <Button
        onClick={() =>
          toast.add({
            type: 'success',
            title: 'Nota 4816 emitida',
            description: 'O PDF foi enviado para o e-mail do cliente.',
          })
        }
      >
        Emitir nota
      </Button>
    </div>
  )
}

/** Aviso de uma espera */
export function PromiseNotice() {
  const toast = useToast()

  const emitir = () =>
    new Promise<string>((resolve) => setTimeout(() => resolve('4817'), 1500))

  return (
    <div className="flex min-h-40 flex-col items-start gap-3">
      <p className="text-base text-fg-muted">
        Com promise, o mesmo aviso atravessa a espera e vira o resultado.
      </p>
      <Button
        variant="secondary"
        onClick={() =>
          toast.promise(emitir(), {
            loading: { title: 'Emitindo a nota…' },
            success: (numero) => ({ title: `Nota ${numero} emitida` }),
            error: { title: 'A emissão falhou', description: 'Tente de novo em instantes.' },
          })
        }
      >
        Emitir com espera
      </Button>
    </div>
  )
}
