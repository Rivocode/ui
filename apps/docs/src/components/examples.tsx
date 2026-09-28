import { use, useMemo, type ComponentType } from 'react'
import { ExampleStage } from '@/components/example-stage'
import { sliceSource, storyKeepsOpen, storyNamesOf, titleFromSource } from '@/example-source'

/* ---------------------------------------------------------------------------
 * The examples
 *
 * The same files the claude.ai/design sync photographs, running for real here.
 * A component snapshot ages silently: the prop changes, the image stays. An
 * example that runs breaks on the spot, and the reader sees the truth.
 *
 * They suspend the page instead of appearing after it: an 8rem box that turns
 * into a 30rem example pushes the whole doc down, and that was the other half
 * of the CLS the piece page scored. Failure is handled by the boundary in
 * `components/boundary.tsx` - a chunk that does not arrive and a new deploy
 * under an old tab, not the reader's mistake.
 * ------------------------------------------------------------------------- */

export function Examples({
  load,
  loadSource,
}: {
  load: () => Promise<Record<string, ComponentType>>
  loadSource?: () => Promise<string>
}) {
  const module = use(load())
  // The source comes from the same file as the example, by another path: it is
  // text the reader reads, and the example is a module React mounts.
  const source = loadSource ? use(loadSource()) : null

  // The module keys come out in alphabetical order, so the main example would
  // land wherever its name happened to sort. The file's own order is the
  // intended reading order: the simple case first, the corners after.
  const stories = useMemo(() => {
    const written = source ? storyNamesOf(source) : []
    const rank = (name: string) => {
      const at = written.indexOf(name)
      return at === -1 ? written.length : at
    }

    return Object.entries(module)
      .filter(([, value]) => typeof value === 'function')
      .sort(([a], [b]) => rank(a) - rank(b))
  }, [module, source])

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
