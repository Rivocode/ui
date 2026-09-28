/* ---------------------------------------------------------------------------
 * The list of guides, once.
 *
 * The site (guides.ts) and llms.txt (vite.config.ts) read separate lists, and
 * the Icons guide was born in one and not the other: it existed in the
 * navigation and was missing from the raw markdown. This is the only source;
 * whoever needs the bodies joins the slug to the content in `content/`.
 * ------------------------------------------------------------------------- */

export const GUIDE_LIST: Array<{ slug: string; title: string; summary: string }> = [
  {
    slug: 'instalacao',
    title: 'Installation',
    summary: 'One command, the two lines of CSS and the Provider.',
  },
  {
    slug: 'inicio-rapido',
    title: 'Quick start',
    summary: 'A real screen: a form that validates and a listing with its states.',
  },
  {
    slug: 'temas',
    title: 'Themes and customization',
    summary: 'The three token layers, and a client theme from start to finish.',
  },
  {
    slug: 'tokens',
    title: 'Tokens in Figma',
    summary: 'The three layers as DTCG JSON, for Tokens Studio and Figma variables.',
  },
  {
    slug: 'densidade',
    title: 'Density',
    summary: 'The same screen at two heights, without two catalogs.',
  },
  {
    slug: 'icones',
    title: 'Icons',
    summary: 'One set, one concept per icon, and the size for each context.',
  },
  {
    slug: 'hooks',
    title: 'Hooks',
    summary: 'Open and close, wait for typing, remember between visits: the hooks every screen rewrites.',
  },
  {
    slug: 'tanstack',
    title: 'With TanStack',
    summary: 'The Router link with the house design, and the Query request in its four end states.',
  },
  {
    slug: 'arquitetura',
    title: 'Recommended architecture',
    summary: 'The roadmap for a new project: folders by feature, the shell, the data and the agent, in Vite or Next.',
  },
  {
    slug: 'documentos-brasileiros',
    title: 'Brazilian documents',
    summary: 'CPF, CNPJ, CNH, título de eleitor, PIS, RENAVAM, license plate and boleto: the math for each.',
  },
  {
    slug: 'react-native',
    title: 'React Native',
    summary: 'The same vocabulary on mobile, with a theme that switches at runtime.',
  },
  {
    slug: 'para-agents',
    title: 'For agents',
    summary: 'Raw markdown, llms.txt, the MCP server and how to ask in the prompt.',
  },
  {
    slug: 'skill',
    title: 'Skill',
    summary: 'One command, and the agent learns the whole library.',
  },
]
