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
  /** Pagina de erro: nao tem listagem, entao o markdown nao cobra os quatro finais. */
  errorPage?: boolean
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
  {
    slug: 'pagina-nao-encontrada',
    file: 'not-found',
    title: 'Página não encontrada (404)',
    summary:
      'O endereço que não existe mais: a busca no sistema inteiro, o caminho de volta e os lugares mais procurados.',
    pieces: ['Heading', 'Text', 'SearchInput', 'Button', 'Link'],
    errorPage: true,
  },
  {
    slug: 'erro-inesperado',
    file: 'server-error',
    title: 'Erro inesperado (500)',
    summary:
      'A falha que foi do servidor: tentar de novo com o botão em carga, e o código do atendimento para copiar e mandar ao suporte.',
    pieces: ['Heading', 'Text', 'Button', 'Card', 'DescriptionList', 'Clipboard', 'Link'],
    errorPage: true,
  },
  {
    slug: 'manutencao-programada',
    file: 'maintenance',
    title: 'Manutenção programada',
    summary:
      'O sistema fora do ar por hora marcada: quando volta, no horário de Brasília, o que para, o que continua e o link da página de status.',
    pieces: ['Badge', 'Heading', 'Text', 'Card', 'DescriptionList', 'Button', 'Link'],
    errorPage: true,
  },
  {
    slug: 'sem-permissao',
    file: 'forbidden',
    title: 'Sem permissão (403)',
    summary:
      'A área que a conta não alcança: quem libera, o pedido de acesso com a confirmação na tela, e a saída para entrar com outra conta.',
    pieces: ['Heading', 'Text', 'Card', 'DescriptionList', 'Badge', 'Alert', 'Button', 'Link'],
    errorPage: true,
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

Uma tela inteira, montada só com peças do @rivocode/ui e as regras da skill. ${
    block.errorPage
      ? `Copie o arquivo e troque os endereços e os dados de exemplo pelos da sua aplicação. A página diz o que aconteceu, de quem foi a falha e o que fazer agora, e nunca mostra stack nem nome de endpoint: o código que ela oferece para copiar é o do atendimento, que o suporte procura no log.`
      : `Copie o arquivo, troque os dados de exemplo pelos da sua consulta e mantenha os quatro finais: dados, carregando, erro e vazio.`
  } Ele importa só de \`@rivocode/ui\`,
\`@rivocode/ui/form\`, \`@rivocode/ui/chart\`, \`zod\`, \`lucide-react\` e \`react\`.

Peças: ${pieces}.

Ao vivo, no desktop e no celular: ${site}/blocos#${block.slug}

## Código

\`\`\`tsx
${source.trimEnd()}
\`\`\`
`
}
