import { forwardsRootProps, propsOf } from '@/props'

/** Splits a union type so long ones wrap as values instead of one long line. */
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
  /** Inside the "Partes" list, where a full box per part would be noise. */
  compact?: boolean
}) {
  const props = propsOf(component)

  if (props.length === 0) {
    const aviso = 'Sem prop própria: repassa ao elemento de baixo o que você mandar.'

    return compact ? (
      <p className="text-sm text-fg-subtle">{aviso}</p>
    ) : (
      <p className="rounded-md border border-border bg-surface p-4 text-sm text-fg-subtle">
        {aviso}
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
