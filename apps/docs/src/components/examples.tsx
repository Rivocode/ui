import { use, useMemo, type ComponentType } from 'react'
import { ExampleStage } from '@/components/example-stage'
import { sliceSource, storyKeepsOpen, storyNamesOf, titleFromSource } from '@/example-source'

/* ---------------------------------------------------------------------------
 * Os exemplos
 *
 * Os mesmos arquivos que o sync do claude.ai/design fotografa, aqui rodando de
 * verdade. Retrato de componente envelhece em silencio: a prop muda, a imagem
 * fica. Exemplo que roda quebra na hora, e quem le ve a verdade.
 *
 * Eles suspendem a pagina em vez de aparecerem depois dela: uma caixa de 8rem
 * que vira um exemplo de 30rem empurra a doc inteira para baixo, e era o outro
 * lado do CLS que a pagina de peca marcava. Quem cuida da falha e a fronteira
 * em `components/boundary.tsx` - chunk que nao chega e deploy novo por baixo
 * de aba velha, e nao erro de quem le.
 * ------------------------------------------------------------------------- */

export function Examples({
  load,
  loadSource,
}: {
  load: () => Promise<Record<string, ComponentType>>
  loadSource?: () => Promise<string>
}) {
  const module = use(load())
  // A fonte vem do mesmo arquivo do exemplo, por outro caminho: ela e texto que
  // o leitor le, e ele e modulo que o React monta.
  const source = loadSource ? use(loadSource()) : null

  // As chaves do modulo saem em ordem alfabetica, entao o exemplo principal
  // cairia onde o nome dele por acaso ordenasse. A ordem do proprio arquivo e a
  // ordem de leitura pretendida: o caso simples primeiro, os cantos depois.
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
