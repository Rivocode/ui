/* ---------------------------------------------------------------------------
 * The parts
 *
 * `TableRow` lives on the `Table` page, not on a page of its own.
 *
 * More than a hundred and fifty shallow entries in the sidebar force whoever
 * wants a table to open six pages to build one. The rule is the name: a piece
 * whose name starts with that of another catalog piece is part of it -
 * `CardHeader` of `Card`, `ComboboxItem` of `Combobox`. The longest prefix
 * wins, otherwise `ChartTooltipContent` would land in `Chart` instead of in
 * `ChartTooltip`.
 *
 * `DataTable` does not become part of `Table`: its name does not start with
 * it, and the two are genuinely independent pieces.
 *
 * Used by the catalog the page reads and by the plugin that writes the raw
 * markdown, so a part lands in the same place in both.
 * ------------------------------------------------------------------------- */

/**
 * The pieces the rule would swallow, and should not.
 *
 * The prefix says `AlertDialog` is part of `Alert`, and it is not: one is a
 * banner that stays on screen, the other is a modal that demands an answer.
 * The same goes for `ToggleGroup`, which is a control of its own and not a
 * slice of `Toggle`. The heuristic pays for itself on the seventy-odd real
 * parts; these are the ones it gets wrong, listed instead of guessed.
 *
 * The `*Group` pieces are the ones that keep being forgotten here, and the
 * forgetting is invisible: the piece does not vanish, it just stops being
 * counted and moves to another piece's page. `ButtonGroup` spent a whole
 * release inside `Button` exactly because of this, while having its own doc
 * and its own export.
 */
const STANDALONE = new Set([
  'AlertDialog',
  'ButtonGroup',
  'CheckboxGroup',
  'InputGroup',
  'Menubar',
  'NavigationMenu',
  'RadioGroup',
  'ResizablePanelGroup',
  'ToggleGroup',
  'TableOfContents',
  'TreeSelect',
])

/**
 * Where the rule points to the wrong parent.
 *
 * `TabList` starts with `Tab`, so the prefix throws it onto the lone tab
 * instead of `Tabs`, which is the piece someone actually reads about. The
 * chart parts have no `Chart` entry to land in, so they name the container.
 */
const PARENT: Record<string, string> = {
  Tab: 'Tabs',
  TabList: 'Tabs',
  TabPanel: 'Tabs',
  ChartTooltipContent: 'ChartContainer',
  ChartLegendContent: 'ChartContainer',
  // The prefix hands these to `Input`, and they are pieces of `InputGroup`: a
  // lone `Input` has no prefix and no action.
  InputPrefix: 'InputGroup',
  InputSuffix: 'InputGroup',
  InputAction: 'InputGroup',
  // The group is the control; the radio is one of its options.
  Radio: 'RadioGroup',
  // The family has no `Resizable` root: the group is the piece, and the panel
  // and the handle are parts of it.
  ResizablePanel: 'ResizablePanelGroup',
  ResizableHandle: 'ResizablePanelGroup',
}

export function findParent(name: string, names: Iterable<string>) {
  if (STANDALONE.has(name)) return null

  const named = PARENT[name]
  if (named) {
    // Only when the parent really is in the catalog: a stale entry here would
    // hide the piece from the sidebar entirely.
    for (const other of names) if (other === named) return named
    return null
  }

  let best: string | null = null

  for (const other of names) {
    if (other === name || !name.startsWith(other)) continue
    // What is left after the prefix has to start with an uppercase letter,
    // otherwise `Tab` would swallow `Table` by an accident of spelling.
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
 * piece was born with the wrong import line on its own page, pointing to the
 * main package. Nobody remembers to come back here.
 */
const isChart = (name: string) => name.startsWith('Chart') || name === 'Sparkline'

/**
 * What comes from `@rivocode/ui/ai`. A written list, not a prefix: the five
 * names share no root, and `Message` cannot be guessed from anything.
 */
const AI_SUBPATH = new Set(['AILabel', 'Conversation', 'Message', 'PromptInput', 'ToolCall'])

/**
 * What comes from `@rivocode/ui/dnd`, behind the optional dnd-kit peer. A
 * written list, like the AI one: `Kanban` and `SortableList` share no prefix.
 */
const DND_SUBPATH = new Set(['Kanban', 'SortableList'])

/**
 * What comes from `@rivocode/ui/editor`: the editor and the piece that shows
 * what it saved. The two live together because the format is one, and whoever
 * shows without editing does not import Tiptap - `RichTextView` never touches
 * it.
 */
const EDITOR_SUBPATH = new Set(['RichTextEditor', 'RichTextView'])

/** Which entry point the piece comes from; the subpaths are optional on purpose. */
export function importPathOf(name: string) {
  if (FORM_SUBPATH.has(name)) return '@rivocode/ui/form'
  if (isChart(name)) return '@rivocode/ui/chart'
  if (AI_SUBPATH.has(name)) return '@rivocode/ui/ai'
  if (DND_SUBPATH.has(name)) return '@rivocode/ui/dnd'
  if (EDITOR_SUBPATH.has(name)) return '@rivocode/ui/editor'
  return '@rivocode/ui'
}
