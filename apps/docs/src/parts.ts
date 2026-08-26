/* ---------------------------------------------------------------------------
 * As partes
 *
 * `TableRow` mora na pagina de `Table`, e nao numa pagina propria.
 *
 * Mais de cento e cinquenta entradas rasas na barra lateral obrigam quem quer
 * uma tabela a abrir seis paginas para montar uma. A regra e o nome: peca cujo
 * nome comeca com o de outra peca do catalogo e parte dela - `CardHeader` de
 * `Card`, `ComboboxItem` de `Combobox`. Ganha o prefixo mais longo, senao
 * `ChartTooltipContent` cairia em `Chart` em vez de em `ChartTooltip`.
 *
 * `DataTable` nao vira parte de `Table`: o nome dela nao comeca com ele, e as
 * duas sao pecas de fato independentes.
 *
 * Usada pelo catalogo que a pagina le e pelo plugin que escreve o markdown cru,
 * para uma parte cair no mesmo lugar nos dois.
 * ------------------------------------------------------------------------- */

/**
 * As pecas que a regra engoliria, e nao deveria.
 *
 * O prefixo diz que `AlertDialog` e parte de `Alert`, e nao e: um e uma tarja
 * que fica na tela, o outro e um modal que exige resposta. O mesmo vale para
 * `ToggleGroup`, que e controle proprio e nao fatia de `Toggle`. A heuristica
 * se paga nas setenta e tantas partes de verdade; estas sao as que ela erra,
 * listadas em vez de adivinhadas.
 *
 * As pecas `*Group` sao as que vivem sendo esquecidas aqui, e o esquecimento e
 * invisivel: a peca nao some, ela so para de ser contada e se muda para a
 * pagina de outra. O `ButtonGroup` passou um release inteiro dentro de `Button`
 * exatamente por isso, tendo doc propria e export proprio.
 */
const STANDALONE = new Set([
  'AlertDialog',
  'ButtonGroup',
  'CheckboxGroup',
  'InputGroup',
  'Menubar',
  'NavigationMenu',
  'RadioGroup',
  'ToggleGroup',
  'TreeSelect',
])

/**
 * Onde a regra aponta para o pai errado.
 *
 * `TabList` comeca com `Tab`, entao o prefixo o joga na aba solta em vez de em
 * `Tabs`, que e a peca sobre a qual alguem de fato le. As partes do grafico nao
 * tem uma entrada `Chart` onde cair, entao elas nomeiam o container.
 */
const PARENT: Record<string, string> = {
  Tab: 'Tabs',
  TabList: 'Tabs',
  TabPanel: 'Tabs',
  ChartTooltipContent: 'ChartContainer',
  ChartLegendContent: 'ChartContainer',
  // O prefixo entrega estas ao `Input`, e elas sao pecas do `InputGroup`: um
  // `Input` sozinho nao tem prefixo nem acao.
  InputPrefix: 'InputGroup',
  InputSuffix: 'InputGroup',
  InputAction: 'InputGroup',
  // O grupo e o controle; o radio e uma das opcoes dele.
  Radio: 'RadioGroup',
}

export function findParent(name: string, names: Iterable<string>) {
  if (STANDALONE.has(name)) return null

  const named = PARENT[name]
  if (named) {
    // So quando o pai esta mesmo no catalogo: uma entrada envelhecida aqui
    // esconderia a peca da barra lateral por inteiro.
    for (const other of names) if (other === named) return named
    return null
  }

  let best: string | null = null

  for (const other of names) {
    if (other === name || !name.startsWith(other)) continue
    // O que sobra depois do prefixo tem que comecar com maiuscula, senao `Tab`
    // engoliria `Table` por acidente de grafia.
    if (!/^[A-Z]/.test(name.slice(other.length))) continue
    if (!best || other.length > best.length) best = other
  }

  return best
}

const FORM_SUBPATH = new Set(['Form', 'FormField'])

/**
 * O que vem de `@rivocode/ui/chart`.
 *
 * Por prefixo, e nao por lista escrita a mao: a lista existiu, e toda peca nova
 * de grafico nascia com a linha de import errada na propria pagina, apontando
 * para o pacote principal. Ninguem lembra de voltar aqui.
 */
const isChart = (name: string) => name.startsWith('Chart') || name === 'Sparkline'

/** De qual entrada a peca vem; os subcaminhos sao opcionais de proposito. */
export function importPathOf(name: string) {
  if (FORM_SUBPATH.has(name)) return '@rivocode/ui/form'
  if (isChart(name)) return '@rivocode/ui/chart'
  return '@rivocode/ui'
}
