import { forwardsRootProps, propsOf } from '@/props'

/** Parte o tipo de uniao, para o longo quebrar por valor e nao numa linha so. */
function TypeCell({ type }: { type: string }) {
  const parts = type.split(' | ')

  if (parts.length < 3) {
    return <code className="font-mono text-xs text-accent-text">{type}</code>
  }

  return (
    <span className="flex flex-wrap gap-1">
      {parts.map((part) => (
        <code
          key={part}
          className="rounded-sm bg-accent-subtle px-1.5 py-0.5 font-mono text-xs text-accent-text"
        >
          {part}
        </code>
      ))}
    </span>
  )
}

export function PropsTable({
  component,
  compact,
}: {
  component: string
  /** Dentro da lista "Partes", onde uma caixa inteira por parte seria ruido. */
  compact?: boolean
}) {
  const props = propsOf(component)

  if (props.length === 0) {
    const toast = 'Sem prop própria: repassa ao elemento de baixo o que você mandar.'

    return compact ? (
      <p className="text-sm text-fg-subtle">{toast}</p>
    ) : (
      <p className="rounded-md border border-border bg-surface p-4 text-sm text-fg-subtle">
        {toast}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-2.5 font-mono text-xs tracking-wide text-fg-subtle uppercase">
                Prop
              </th>
              <th className="px-4 py-2.5 font-mono text-xs tracking-wide text-fg-subtle uppercase">
                Tipo
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop) => (
              <tr key={prop.name} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 align-top">
                  <code className="font-mono text-sm whitespace-nowrap text-fg">{prop.name}</code>
                  {prop.required && (
                    <span className="ml-2 font-mono text-[0.65rem] tracking-wide text-danger-text uppercase">
                      obrigatória
                    </span>
                  )}
                  {/* Quem tem uma versão velha instalada precisa saber se a
                      prop existe para ele — e hoje descobre pelo erro de tipo,
                      ou pior, pelo atributo solto no DOM. */}
                  {prop.since && (
                    <span
                      title={`Existe desde a versão ${prop.since}`}
                      className="ml-2 font-mono text-[0.65rem] tracking-wide text-fg-subtle"
                    >
                      {prop.since}
                    </span>
                  )}
                  {prop.note && (
                    <p className="mt-1 max-w-xs text-xs leading-relaxed text-balance text-fg-subtle">
                      {prop.note}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <TypeCell type={prop.type} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {forwardsRootProps(component) && (
        <p className="border-t border-border bg-surface px-4 py-3 text-xs text-fg-subtle">
          Além destas, a peça aceita <code className="font-mono">className</code>,{' '}
          <code className="font-mono">style</code>, <code className="font-mono">id</code> e{' '}
          <code className="font-mono">children</code>, repassados ao elemento de baixo.
        </p>
      )}
    </div>
  )
}
