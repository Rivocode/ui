import { Badge } from '@rivocode/ui'
import { ENTRIES, FAMILIES, WITH_EXAMPLE, entriesOfFamily } from '@/catalog'
import { linkTo, type Route } from '@/routes'

/* ---------------------------------------------------------------------------
 * The catalog page
 *
 * Every piece, on one screen. The sidebar already lists the names, but a
 * list answers "does X exist" and only that; this page answers "what do I
 * have to build with", family by family, with the first sentence of each
 * doc doing the introduction.
 * ------------------------------------------------------------------------- */

export function CatalogPage({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <div className="px-4 py-10 sm:px-6">
      <Badge tone="accent">Catálogo</Badge>
      <h1 className="mt-3 font-display text-3xl tracking-display text-fg">
        As {ENTRIES.length} peças, numa tela
      </h1>
      <p className="mt-2 max-w-2xl text-fg-muted">
        {WITH_EXAMPLE} delas com exemplo que roda na própria página. A primeira frase de cada
        documento apresenta a peça; o resto mora a um clique.
      </p>

      {FAMILIES.map((family) => {
        const entries = entriesOfFamily(family)
        if (entries.length === 0) return null

        return (
          <section key={family} className="mt-10">
            <h2 className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
              {family}
              <span className="ml-2 text-fg-disabled">{entries.length}</span>
            </h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {entries.map((entry) => {
                const link = linkTo({ kind: 'component', slug: entry.slug }, navigate)
                return (
                  <a
                    key={entry.name}
                    href={link.href}
                    onClick={link.onClick}
                    className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm text-fg group-hover:text-accent-text">
                        {entry.name}
                      </span>
                      {entry.parts && entry.parts.length > 0 && (
                        <span className="shrink-0 text-xs text-fg-subtle">
                          +{entry.parts.length} partes
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-fg-muted">
                      {entry.summary}
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
