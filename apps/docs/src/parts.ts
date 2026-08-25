/* ---------------------------------------------------------------------------
 * Parts
 *
 * `TableRow` belongs on the `Table` page, not on one of its own.
 *
 * A hundred and six flat entries in the sidebar force whoever is after a table
 * to open six pages to assemble one. The rule is the name: a piece whose name
 * starts with another piece of the catalog is a part of it, `CardHeader` of
 * `Card`, `ComboboxItem` of `Combobox`. The longest prefix wins, otherwise
 * `ChartTooltipContent` would land on `Chart` instead of `ChartTooltip`.
 *
 * `DataTable` does not become a part of `Table`: its name does not start with
 * it, and the two are genuinely independent pieces.
 *
 * Shared by the catalog the page reads and by the plugin that writes the raw
 * markdown, so a part lands in the same place in both.
 * ------------------------------------------------------------------------- */

/**
 * Pieces the rule would swallow, and shouldn't.
 *
 * The prefix says `AlertDialog` is a part of `Alert`, and it is not: one is a
 * banner that stays on the screen, the other is a modal that demands an
 * answer. Same for `ToggleGroup`, which is its own control and not a slice of
 * `Toggle`. The heuristic pays for itself on the forty-odd real parts; these
 * are the ones it gets wrong, listed rather than guessed at.
 */
const STANDALONE = new Set([
  'AlertDialog',
  'CheckboxGroup',
  'InputGroup',
  'Menubar',
  'NavigationMenu',
  'RadioGroup',
  'ToggleGroup',
  'TreeSelect',
])

/**
 * Where the rule points at the wrong parent.
 *
 * `TabList` starts with `Tab`, so the prefix lands it on the single tab
 * instead of on `Tabs`, which is the piece anyone actually reads about. The
 * chart parts have no `Chart` entry to fall into, so they name the container.
 */
const PARENT: Record<string, string> = {
  Tab: 'Tabs',
  TabList: 'Tabs',
  TabPanel: 'Tabs',
  ChartTooltipContent: 'ChartContainer',
  ChartLegendContent: 'ChartContainer',
  // The prefix hands these to `Input`, and they are pieces of `InputGroup`:
  // an `Input` on its own has no prefix and no action.
  InputPrefix: 'InputGroup',
  InputSuffix: 'InputGroup',
  InputAction: 'InputGroup',
  // The group is the control; the radio is one of its options.
  Radio: 'RadioGroup',
}

export function findParent(name: string, names: Iterable<string>) {
  if (STANDALONE.has(name)) return null

  const named = PARENT[name]
  if (named) {
    // Only when the parent is really in the catalog: a stale entry here would
    // otherwise hide the piece from the sidebar entirely.
    for (const other of names) if (other === named) return named
    return null
  }

  let best: string | null = null

  for (const other of names) {
    if (other === name || !name.startsWith(other)) continue
    // What is left after the prefix has to start with a capital, otherwise
    // `Tab` would swallow `Table` by an accident of spelling.
    if (!/^[A-Z]/.test(name.slice(other.length))) continue
    if (!best || other.length > best.length) best = other
  }

  return best
}

const FORM_SUBPATH = new Set(['Form', 'FormField'])

/**
 * What comes from `@rivocode/ui/chart`.
 *
 * By prefix, not by a hand-written list: the list existed, and every new chart
 * piece was born with the wrong import line on its own page, pointing at the
 * main package. Nobody remembers to come back here.
 */
const isChart = (name: string) => name.startsWith('Chart') || name === 'Sparkline'

/** Which entry point a piece comes from, the subpaths are opt-in on purpose. */
export function importPathOf(name: string) {
  if (FORM_SUBPATH.has(name)) return '@rivocode/ui/form'
  if (isChart(name)) return '@rivocode/ui/chart'
  return '@rivocode/ui'
}
