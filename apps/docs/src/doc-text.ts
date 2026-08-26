/* ---------------------------------------------------------------------------
 * O texto de um documento, lido dos dois lados
 *
 * A pagina le o `.md` no navegador e o indice do catalogo le o mesmo `.md` no
 * build. Enquanto cada lado tinha a sua copia destas tres funcoes, a lede da
 * lista lateral e a do indice podiam divergir sem nada acusar - e a lede e o
 * unico texto do documento que o site carrega antes de a peca ser aberta.
 * ------------------------------------------------------------------------- */

/** Separa o `---` do topo do corpo. Sem frontmatter, a familia e "Geral". */
export function splitFrontmatter(raw: string) {
  const front = /^---\n([\s\S]*?)\n---\n/.exec(raw)
  if (!front) return { family: 'Geral', body: raw }
  return {
    family: /category:\s*(.+)/.exec(front[1])?.[1].trim() ?? 'Geral',
    body: raw.slice(front[0].length),
  }
}

/**
 * A doc abre com o proprio `# Nome`, que a pagina ja imprime como titulo.
 * Mantido no `.md` cru: arquivo servido sozinho precisa de titulo.
 */
export function dropLeadingHeading(body: string) {
  return body.replace(/^\s*#\s+\S.*\n+/, '')
}

/** A primeira linha de prosa depois do titulo, sem marcacao. */
export function firstSentence(body: string) {
  const line = body
    .split('\n')
    .map((text) => text.trim())
    .find((text) => text.length > 0 && !text.startsWith('#') && !text.startsWith('```'))

  if (!line) return ''
  const clean = line.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1')
  return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean
}
