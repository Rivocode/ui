import { slugify } from './slug'

/* ---------------------------------------------------------------------------
 * Os blocos de pagina, uma vez.
 *
 * O site (pages/blocks.tsx), o markdown cru (agent-docs.ts) e a guarda
 * (test/blocos-de-pagina.test.tsx) leem daqui. O codigo de cada bloco mora em
 * `blocks/<file>.tsx` e e o mesmo arquivo que roda no preview e que a pessoa
 * copia: nao ha segunda copia para envelhecer.
 * ------------------------------------------------------------------------- */

export type BlockEntry = {
  slug: string
  file: string
  title: string
  summary: string
  pieces: string[]
}

export const BLOCK_LIST: BlockEntry[] = [
  {
    slug: 'login',
    file: 'login',
    title: 'Login',
    summary:
      'E-mail e senha validados com zod, o olho que revela a senha, e o erro de credencial num Alert que fica na tela.',
    pieces: ['Card', 'Form', 'PasswordInput', 'Checkbox', 'Alert', 'Link', 'Heading'],
  },
  {
    slug: 'painel',
    file: 'dashboard',
    title: 'Painel',
    summary:
      'Quatro indicadores com tendência, o gráfico de área dos últimos meses e as últimas notas numa tabela.',
    pieces: ['PageHeader', 'Stat', 'Sparkline', 'ChartContainer', 'DataTable'],
  },
  {
    slug: 'listagem',
    file: 'listing',
    title: 'Listagem com filtros',
    summary:
      'Busca, filtro por situação, as fichas do que está aplicado, seleção de linhas com a barra de ações e paginação.',
    pieces: ['PageHeader', 'SearchInput', 'Select', 'FilterBar', 'DataTable', 'Badge'],
  },
  {
    slug: 'cadastro',
    file: 'signup',
    title: 'Cadastro de cliente',
    summary:
      'Formulário de duas seções com zod: CNPJ e CPF pelo dígito verificador, telefone e CEP com máscara, estado num Select.',
    pieces: ['PageHeader', 'Form', 'FormField', 'MaskedInput', 'Select', 'Card'],
  },
  {
    slug: 'configuracoes',
    file: 'settings',
    title: 'Configurações',
    summary:
      'Perfil, empresa, avisos e segurança em abas, com os acessos abertos e a exclusão de conta confirmada num AlertDialog.',
    pieces: ['PageHeader', 'Tabs', 'Switch', 'Item', 'PasswordInput', 'AlertDialog'],
  },
  {
    slug: 'vazio-e-erro',
    file: 'empty-and-error',
    title: 'Vazio, erro e carregando',
    summary:
      'Os quatro finais de uma listagem na mesma tela: primeira vez, filtro sem resultado, erro com nova tentativa e carregando.',
    pieces: ['EmptyState', 'DataTable', 'ToggleGroup', 'PageHeader'],
  },
]

/** De onde o bloco pode importar. Qualquer outra origem quebra quem copia. */
export const BLOCK_IMPORTS = [
  '@rivocode/ui',
  '@rivocode/ui/form',
  '@rivocode/ui/chart',
  'zod',
  'lucide-react',
  'react',
]

/** Os modulos que um arquivo de bloco importa, na ordem em que aparecem. */
export function importsOf(source: string) {
  return [...source.matchAll(/^\s*import\s[^'"]*?['"]([^'"]+)['"]/gm)].map((hit) => hit[1]!)
}

/** O markdown que um agent le, com o arquivo inteiro para copiar. */
export function blockMarkdown(block: BlockEntry, source: string, site: string) {
  const pieces = block.pieces
    .map((piece) => `[${piece}](${site}/componentes/${slugify(piece)}.md)`)
    .join(', ')

  return `# Bloco: ${block.title}

${block.summary}

Uma tela inteira, montada só com peças do @rivocode/ui e as regras da skill. Copie
o arquivo, troque os dados de exemplo pelos da sua consulta e mantenha os quatro
finais: dados, carregando, erro e vazio. Ele importa só de \`@rivocode/ui\`,
\`@rivocode/ui/form\`, \`@rivocode/ui/chart\`, \`zod\`, \`lucide-react\` e \`react\`.

Peças: ${pieces}.

Ao vivo, no desktop e no celular: ${site}/blocos#${block.slug}

## Código

\`\`\`tsx
${source.trimEnd()}
\`\`\`
`
}
