import { Kbd } from '@rivocode/ui'

/** Atalhos */
export function Shortcuts() {
  return (
    <div className="flex flex-col gap-3 text-base text-fg-muted">
      <p className="flex items-center gap-2">
        Abrir a paleta <Kbd keys="mod+k" />
      </p>
      <p className="flex items-center gap-2">
        Fechar a barra lateral <Kbd keys="mod+b" />
      </p>
      <p className="flex items-center gap-2">
        Sair sem salvar <Kbd>Esc</Kbd>
      </p>
    </div>
  )
}

/** Dentro de uma frase */
export function InProse() {
  return (
    <p className="max-w-md text-base leading-relaxed text-fg-muted">
      Segure <Kbd size="sm" keys="shift" /> e clique para marcar várias linhas de uma vez. Com{' '}
      <Kbd size="sm" keys="mod" /> a marcação vai somando, uma a uma.
    </p>
  )
}
