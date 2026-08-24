/* ---------------------------------------------------------------------------
 * Props, for the page
 *
 * The API table is read from the `.d.ts` the package build emits, one file per
 * component. Hand-written prop tables are the first thing to rot: a prop gets
 * renamed, the table keeps the old name, and the page lies with confidence.
 *
 * The parsing itself lives in `props-parse.ts`, shared with the plugin that
 * writes the raw markdown.
 * ------------------------------------------------------------------------- */

import { parseProps, parsesRootProps, type Prop } from '@/props-parse'

export type { Prop }

/*
 * Vem de um JSON versionado, e nao mais de um glob sobre `ds-bundle/`: aquele
 * diretorio tem 14 MB e fica fora do Git, entao o site publicado saia com a
 * prosa de cada peca e nenhuma prop. `bun run scripts/tipos-do-catalogo.ts`
 * regenera este arquivo depois de um sync novo.
 */
import TYPES from '@/component-types.json'

const byName = new Map<string, string>(Object.entries(TYPES as Record<string, string>))

export function propsOf(component: string): Prop[] {
  return parseProps(byName.get(component), component)
}

/** Whether this component forwards the usual root props. */
export function forwardsRootProps(component: string) {
  return parsesRootProps(byName.get(component))
}
