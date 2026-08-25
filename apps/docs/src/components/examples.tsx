import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { ExampleStage } from '@/components/example-stage'
import { sliceSource, storyKeepsOpen, storyNamesOf, titleFromSource } from '@/example-source'

/* ---------------------------------------------------------------------------
 * Examples
 *
 * The same files the claude.ai/design sync photographs, here running for
 * real. A screenshot of a component ages quietly: the prop changes, the image
 * stays. A running example breaks on the spot, and the reader sees the truth.
 * ------------------------------------------------------------------------- */

export function Examples({
  load,
  source,
}: {
  load: () => Promise<Record<string, ComponentType>>
  source?: string
}) {
  const [module, setModule] = useState<Record<string, ComponentType> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    load().then(
      (loaded) => alive && setModule(loaded),
      (failure: unknown) => alive && setError(String(failure)),
    )
    return () => {
      alive = false
    }
  }, [load])

  // The module's keys come out alphabetical, so the main example would land
  // wherever its name happened to sort. The file's own order is the intended
  // reading order: the plain case first, the corners after it.
  const stories = useMemo(() => {
    if (!module) return []

    const written = source ? storyNamesOf(source) : []
    const rank = (name: string) => {
      const at = written.indexOf(name)
      return at === -1 ? written.length : at
    }

    return Object.entries(module)
      .filter(([, value]) => typeof value === 'function')
      .sort(([a], [b]) => rank(a) - rank(b))
  }, [module, source])

  if (error) {
    return (
      <p className="rounded-md border border-danger bg-danger-subtle p-4 text-sm text-danger-text">
        O exemplo não carregou: {error}
      </p>
    )
  }

  if (!module) {
    return <div className="h-32 animate-pulse rounded-lg border border-border bg-surface" />
  }

  return (
    <div className="space-y-4">
      {stories.map(([name, Example]) => (
        <ExampleStage
          key={name}
          name={name}
          Example={Example}
          source={source ? sliceSource(source, name) : null}
          title={source ? titleFromSource(source, name) : undefined}
          keepOpen={source ? storyKeepsOpen(source, name) : false}
        />
      ))}
    </div>
  )
}
