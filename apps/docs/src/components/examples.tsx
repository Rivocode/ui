import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { ExampleStage } from '@/components/example-stage'
import { sliceSource, storyKeepsOpen, storyNamesOf, titleFromSource } from '@/example-source'

/* ---------------------------------------------------------------------------
 * Os exemplos
 *
 * Os mesmos arquivos que o sync do claude.ai/design fotografa, aqui rodando de
 * verdade. Retrato de componente envelhece em silencio: a prop muda, a imagem
 * fica. Exemplo que roda quebra na hora, e quem le ve a verdade.
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

  // As chaves do modulo saem em ordem alfabetica, entao o exemplo principal
  // cairia onde o nome dele por acaso ordenasse. A ordem do proprio arquivo e a
  // ordem de leitura pretendida: o caso simples primeiro, os cantos depois.
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
