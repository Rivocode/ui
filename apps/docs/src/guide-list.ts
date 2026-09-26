/* ---------------------------------------------------------------------------
 * A lista de guias, uma vez.
 *
 * O site (guides.ts) e o llms.txt (vite.config.ts) liam listas separadas, e
 * o guia de Ícones nasceu numa e não na outra: existia na navegação e faltava
 * no markdown cru. Aqui é a única fonte; quem precisar dos corpos junta o
 * slug ao conteúdo em `content/`.
 * ------------------------------------------------------------------------- */

export const GUIDE_LIST: Array<{ slug: string; title: string; summary: string }> = [
  {
    slug: 'instalacao',
    title: 'Instalação',
    summary: 'Um comando, as duas linhas de CSS e o Provider.',
  },
  {
    slug: 'inicio-rapido',
    title: 'Início rápido',
    summary: 'Uma tela de verdade: formulário que valida e listagem com os estados.',
  },
  {
    slug: 'temas',
    title: 'Temas e personalização',
    summary: 'As três camadas de token, e um tema de cliente do começo ao fim.',
  },
  {
    slug: 'tokens',
    title: 'Tokens no Figma',
    summary: 'As três camadas em JSON DTCG, para o Tokens Studio e as variáveis do Figma.',
  },
  {
    slug: 'densidade',
    title: 'Densidade',
    summary: 'A mesma tela em duas alturas, sem dois catálogos.',
  },
  {
    slug: 'icones',
    title: 'Ícones',
    summary: 'Um conjunto, um conceito por ícone, e o tamanho de cada contexto.',
  },
  {
    slug: 'hooks',
    title: 'Hooks',
    summary: 'Abrir e fechar, esperar a digitação, lembrar entre visitas: os hooks que toda tela reescreve.',
  },
  {
    slug: 'tanstack',
    title: 'Com TanStack',
    summary: 'O link do Router com o desenho da casa, e a consulta do Query nos quatro finais.',
  },
  {
    slug: 'documentos-brasileiros',
    title: 'Documentos brasileiros',
    summary: 'CPF, CNPJ, CNH, título, PIS, RENAVAM, placa e boleto: a conta de cada um.',
  },
  {
    slug: 'react-native',
    title: 'React Native',
    summary: 'O mesmo vocabulário no celular, com tema que troca em runtime.',
  },
  {
    slug: 'para-agents',
    title: 'Para agents',
    summary: 'Markdown cru, llms.txt, o servidor MCP e como pedir no prompt.',
  },
  {
    slug: 'skill',
    title: 'Skill',
    summary: 'Um comando, e o agente aprende a biblioteca inteira.',
  },
]
