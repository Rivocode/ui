import { slugify } from './slug'

/* ---------------------------------------------------------------------------
 * The page blocks, once.
 *
 * The site (pages/blocks.tsx), the raw markdown (agent-docs.ts) and the guard
 * (test/page-blocks.test.tsx) read from here. Each block's code lives in
 * `blocks/<file>.tsx` and is the same file that runs in the preview and that
 * the person copies: there is no second copy to go stale.
 * ------------------------------------------------------------------------- */

export type BlockEntry = {
  slug: string
  file: string
  title: string
  summary: string
  pieces: string[]
  /** Error page: it has no listing, so the markdown does not demand the four end states. */
  errorPage?: boolean
}

export const BLOCK_LIST: BlockEntry[] = [
  {
    slug: 'login',
    file: 'login',
    title: 'Login',
    summary:
      'Email and password validated with zod, the eye that reveals the password, and the credential error in an Alert that stays on screen.',
    pieces: ['Card', 'Form', 'PasswordInput', 'Checkbox', 'Alert', 'Link', 'Heading'],
  },
  {
    slug: 'painel',
    file: 'dashboard',
    title: 'Dashboard',
    summary:
      'Four indicators with a trend, the area chart of the last months and the latest invoices in a table.',
    pieces: ['PageHeader', 'Stat', 'Sparkline', 'ChartContainer', 'DataTable'],
  },
  {
    slug: 'listagem',
    file: 'listing',
    title: 'Listing with filters',
    summary:
      'Search, a status filter, chips for what is applied, row selection with the actions bar, and pagination.',
    pieces: ['PageHeader', 'SearchInput', 'Select', 'FilterBar', 'DataTable', 'Badge'],
  },
  {
    slug: 'cadastro',
    file: 'signup',
    title: 'Customer sign-up',
    summary:
      'A two-section form with zod: CNPJ and CPF by check digit, phone and CEP with a mask, state in a Select.',
    pieces: ['PageHeader', 'Form', 'FormField', 'MaskedInput', 'Select', 'Card'],
  },
  {
    slug: 'configuracoes',
    file: 'settings',
    title: 'Settings',
    summary:
      'Profile, company, notifications and security in tabs, with the open sessions and account deletion confirmed in an AlertDialog.',
    pieces: ['PageHeader', 'Tabs', 'Switch', 'Item', 'PasswordInput', 'AlertDialog'],
  },
  {
    slug: 'vazio-e-erro',
    file: 'empty-and-error',
    title: 'Empty, error and loading',
    summary:
      'The four end states of a listing on the same screen: first time, filter with no result, error with retry, and loading.',
    pieces: ['EmptyState', 'DataTable', 'ToggleGroup', 'PageHeader'],
  },
  {
    slug: 'pagina-nao-encontrada',
    file: 'not-found',
    title: 'Page not found (404)',
    summary:
      'The address that no longer exists: search across the whole system, the way back and the most visited places.',
    pieces: ['Heading', 'Text', 'SearchInput', 'Button', 'Link'],
    errorPage: true,
  },
  {
    slug: 'erro-inesperado',
    file: 'server-error',
    title: 'Unexpected error (500)',
    summary:
      'The failure that was the server\'s: try again with the button in its loading state, and the incident code to copy and send to support.',
    pieces: ['Heading', 'Text', 'Button', 'Card', 'DescriptionList', 'Clipboard', 'Link'],
    errorPage: true,
  },
  {
    slug: 'manutencao-programada',
    file: 'maintenance',
    title: 'Scheduled maintenance',
    summary:
      'The system down at a scheduled time: when it comes back, in Brasília time, what stops, what keeps working and the link to the status page.',
    pieces: ['Badge', 'Heading', 'Text', 'Card', 'DescriptionList', 'Button', 'Link'],
    errorPage: true,
  },
  {
    slug: 'sem-permissao',
    file: 'forbidden',
    title: 'No permission (403)',
    summary:
      'The area the account cannot reach: who grants access, the access request with the on-screen confirmation, and the way out to sign in with another account.',
    pieces: ['Heading', 'Text', 'Card', 'DescriptionList', 'Badge', 'Alert', 'Button', 'Link'],
    errorPage: true,
  },
]

/** Where a block may import from. Any other source breaks whoever copies it. */
export const BLOCK_IMPORTS = [
  '@rivocode/ui',
  '@rivocode/ui/form',
  '@rivocode/ui/chart',
  'zod',
  'lucide-react',
  'react',
]

/** The modules a block file imports, in the order they appear. */
export function importsOf(source: string) {
  return [...source.matchAll(/^\s*import\s[^'"]*?['"]([^'"]+)['"]/gm)].map((hit) => hit[1]!)
}

/** The markdown an agent reads, with the whole file to copy. */
export function blockMarkdown(block: BlockEntry, source: string, site: string) {
  const pieces = block.pieces
    .map((piece) => `[${piece}](${site}/componentes/${slugify(piece)}.md)`)
    .join(', ')

  return `# Block: ${block.title}

${block.summary}

A whole screen, built only with @rivocode/ui pieces and the skill's rules. ${
    block.errorPage
      ? `Copy the file and swap the addresses and the sample data for your application's. The page says what happened, whose failure it was and what to do now, and never shows a stack trace or an endpoint name: the code it offers to copy is the incident code, which support looks up in the log.`
      : `Copy the file, swap the sample data for your query's and keep the four end states: data, loading, error and empty.`
  } It imports only from \`@rivocode/ui\`,
\`@rivocode/ui/form\`, \`@rivocode/ui/chart\`, \`zod\`, \`lucide-react\` and \`react\`.

Pieces: ${pieces}.

Live, on desktop and on mobile: ${site}/blocos#${block.slug}

## Code

\`\`\`tsx
${source.trimEnd()}
\`\`\`
`
}
