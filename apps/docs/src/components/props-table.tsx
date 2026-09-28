import { use } from 'react'
import { forwardsRootProps, pieceOf, propsOf } from '@/props'

/** Splits the union type, so a long one breaks per value and not on a single line. */
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
  /** Inside the "Parts" list, where a whole box per part would be noise. */
  compact?: boolean
}) {
  // The table is the tallest part of the page, so it suspends together with
  // the rest instead of arriving later: the height jump at the end of the
  // download was most of the piece page's CLS.
  const piece = use(pieceOf(component))
  const props = propsOf(piece)

  if (props.length === 0) {
    const toast = 'No props of its own: forwards whatever you pass to the element underneath.'

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
                Type
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
                      required
                    </span>
                  )}
                  {/* Whoever has an old version installed needs to know whether
                      the prop exists for them, and today finds out through the
                      type error, or worse, through a stray attribute in the DOM. */}
                  {prop.since && (
                    <span
                      title={`Available since version ${prop.since}`}
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

      {forwardsRootProps(piece) && (
        <p className="border-t border-border bg-surface px-4 py-3 text-xs text-fg-subtle">
          Beyond these, the piece accepts <code className="font-mono">className</code>,{' '}
          <code className="font-mono">style</code>, <code className="font-mono">id</code> and{' '}
          <code className="font-mono">children</code>, forwarded to the element underneath.
        </p>
      )}
    </div>
  )
}
