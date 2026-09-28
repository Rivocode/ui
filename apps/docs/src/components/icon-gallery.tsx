import { SearchInput, useToast } from '@rivocode/ui'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createElement } from 'react'

/* ---------------------------------------------------------------------------
 * The icon gallery
 *
 * Every Lucide icon, with search, one click away from the clipboard. The
 * vector data comes from `virtual:icon-gallery` (see vite.config.ts), a lazy
 * chunk only this page pays for.
 * ------------------------------------------------------------------------- */

type IconNode = Array<[string, Record<string, string>]>

/** `chart-no-axes-column` becomes `ChartNoAxesColumn`, the import name. */
const pascalOf = (slug: string) =>
  slug
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')

function Glyph({ node }: { node: IconNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {node.map(([tag, attrs], index) => createElement(tag, { ...attrs, key: index }))}
    </svg>
  )
}

export function IconGallery() {
  const toast = useToast()
  const [icons, setIcons] = useState<Record<string, IconNode> | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    import('virtual:icon-gallery').then((module) => {
      if (alive) setIcons(module.default as Record<string, IconNode>)
    })
    return () => {
      alive = false
    }
  }, [])

  const names = useMemo(() => (icons ? Object.keys(icons).sort() : []), [icons])
  const visible = useMemo(() => {
    const folded = query.trim().toLowerCase().replace(/\s+/g, '-')
    return folded ? names.filter((name) => name.includes(folded)) : names
  }, [names, query])

  const copy = (name: string) => {
    const pascal = pascalOf(name)
    navigator.clipboard.writeText(`<${pascal} size={16} aria-hidden="true" />`)
    toast.add({
      title: `${pascal} copied`,
      description: `import { ${pascal} } from 'lucide-react'`,
    })
  }

  let body: ReactNode
  if (!icons) {
    body = <p className="py-10 text-center text-sm text-fg-subtle">Loading the collection…</p>
  } else if (visible.length === 0) {
    body = (
      <p className="py-10 text-center text-sm text-fg-muted">
        Nothing by that name. Try "receipt", "chart", "user".
      </p>
    )
  } else {
    body = (
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {visible.map((name) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => copy(name)}
              title={`Copy <${pascalOf(name)} />`}
              className="flex w-full flex-col items-center gap-2 rounded-md border border-border bg-surface px-2 py-3 text-fg-muted transition-colors hover:border-accent hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Glyph node={icons[name]} />
              <span className="w-full truncate text-center font-mono text-[10px] text-fg-subtle">
                {name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl text-fg">The whole collection</h2>
      <p className="mt-2 text-fg-muted">
        {names.length > 0 ? `${names.length} Lucide icons.` : 'Every Lucide icon.'}{' '}
        Clicking copies ready-made JSX; the canonical vocabulary above is still the first choice.
      </p>

      <div className="mt-4 max-w-sm">
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
          placeholder="Search by name"
          aria-label="Search icons"
        />
      </div>

      <div className="mt-5">{body}</div>
    </section>
  )
}
