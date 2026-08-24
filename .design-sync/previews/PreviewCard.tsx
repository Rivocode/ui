import { PreviewCard, PreviewCardContent, PreviewCardTrigger } from '@rivocode/ui'

/** Em link */
export function OnALink() {
  return (
    <div className="min-h-40 w-80">
      <p className="text-base text-fg">
        A nota foi emitida para a{' '}
        <PreviewCard defaultOpen>
          <PreviewCardTrigger
            href="#"
            className="text-accent-text underline decoration-1 underline-offset-2"
          >
            Clínica São Lucas
          </PreviewCardTrigger>
          <PreviewCardContent>
            <p className="font-medium text-fg">Clínica São Lucas</p>
            <p className="mt-1 text-sm text-fg-muted">
              12.345.678/0001-99, cliente desde 2023. Quatro notas em aberto.
            </p>
          </PreviewCardContent>
        </PreviewCard>{' '}
        nesta manha.
      </p>
    </div>
  )
}
