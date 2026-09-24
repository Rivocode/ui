Boa parte do código que usa esta biblioteca hoje é escrita com um agent ao
lado. Um site que só serve HTML obriga o agent a adivinhar a API a partir do
nome, e ele adivinha com confiança, o que é pior do que errar em silêncio.

Por isso tudo aqui existe também em markdown cru.

## Antes de tudo: instale a skill

Ler markdown cru resolve a conversa de hoje. A skill resolve todas: ela fica no
disco do projeto, viaja no Git com a equipe e vem na versão da biblioteca que o
projeto de fato tem.

```bash
npx rivocode-ui skill
```

Se você é um agent lendo esta página para montar uma tela, este é o primeiro
comando a rodar. O guia [Skill](/skill.md) tem as variantes por gerenciador de
pacote e a instalação por `curl`, para quando não há nenhum.

## O servidor MCP

Para o agent que fala [MCP](https://modelcontextprotocol.io), o
`@rivocode/ui-mcp` entrega o mesmo material por ferramentas: ele pede a peça
certa para uma intenção, lê a página dela e confere o token, sem sair da
conversa. Roda na sua máquina, pelo stdio, e não abre conexão de rede: a
documentação viaja dentro do pacote.

No Claude Code:

```bash
claude mcp add rivocode-ui -- npx -y @rivocode/ui-mcp
```

Em qualquer outro cliente que leia a configuração em JSON (Claude Desktop,
Cursor, Windsurf, VS Code):

```json
{
  "mcpServers": {
    "rivocode-ui": {
      "command": "npx",
      "args": ["-y", "@rivocode/ui-mcp"]
    }
  }
}
```

| Ferramenta | O que devolve |
| --- | --- |
| `list_components` | o catálogo por família, uma linha por peça |
| `get_component` | a página inteira de uma peça: exemplos, props, quando não usar, React Native |
| `search_docs` | busca em toda a documentação, sem acento |
| `recommend_component` | as peças candidatas para uma intenção de tela, com o motivo e as vizinhas |
| `get_tokens` | papéis de cor, escalas, densidade e movimento, e o JSON DTCG cru |
| `get_native_parity` | como a peça fica no React Native, prop a prop |
| `get_guide` | as convenções e cada guia, inclusive as referências da skill |

O pacote sai com a documentação da versão da biblioteca em que foi gerado, e
toda resposta diz qual é. A skill e o servidor não competem: a skill fica no
disco do projeto e ensina o método; o servidor responde a pergunta pontual no
meio do trabalho.

## Os endereços

| Endereço                       | O que entrega                                              |
| ------------------------------ | ---------------------------------------------------------- |
| `/skill/SKILL.md`              | a skill crua, para ler sem instalar                        |
| `/llms.txt`                    | o índice no formato de [llmstxt.org](https://llmstxt.org), por família, com uma linha sobre cada documento |
| `/llms-full.txt`               | tudo num arquivo só: convenções, guias e cada peça         |
| `/componentes/<nome>.md`       | o documento de uma peça: prosa, importação, exemplos, props e React Native |
| `/<guia>.md`                   | um guia, como `/temas.md`                                  |
| `/convencoes.md`               | o contrato da biblioteca: Provider, tokens, vocabulário    |

O nome no endereço é o mesmo da página: `ToggleGroup` mora em
`/componentes/toggle-group`, e o markdown dele em
`/componentes/toggle-group.md`.

Na página de cada peça, o botão **Copiar como Markdown** põe esse mesmo
documento na área de transferência, para colar na conversa com o agent.

**São os mesmos arquivos que as páginas renderizam.** Não há uma segunda cópia
para manter, o que você lê como agent é o que a página mostra.

## No prompt

O caminho mais curto é mandar o contrato junto com a peça que interessa:

```
Leia https://ds.rivocode.com.br/convencoes.md e
https://ds.rivocode.com.br/componentes/data-table.md e monte uma listagem de
notas com os estados de carregando, erro e vazio.
```

Para trabalho maior, o índice primeiro:

```
Comece por https://ds.rivocode.com.br/llms.txt e leia o que precisar.
```

Para agent com contexto de sobra e sem acesso à rede depois do primeiro
fetch, o arquivo inteiro de uma vez:

```
Leia https://ds.rivocode.com.br/llms-full.txt antes de começar.
```

## De onde isso vem

Os documentos não foram escritos para o site. Eles nasceram para o sync com o
`claude.ai/design`, onde um agent monta telas com estas peças, e por isso já
respondem o que um agent pergunta: para que serve, quando **não** usar, e qual
a diferença para a peça parecida do lado.

O padrão não é nosso: a própria Base UI envia a documentação inteira dentro do
pacote, em `node_modules/@base-ui/react/docs/`. Foi assim que o `Sheet` desta
biblioteca foi construído sem chutar API.

## Por que a skill ganha do prompt

Colar o contrato no prompt funciona uma vez. Na segunda conversa ele não está
lá, e o agent volta a adivinhar a API pelo nome, com confiança, que é pior do
que errar em silêncio.

A skill fica instalada e viaja dentro do pacote: quem sobe a versão da
biblioteca tem a skill nova a um comando de distância. E ela é uma pasta, não um
arquivo — o método de montar uma tela, a forma da tarefa, o texto da interface,
layout, design, escolha de peça, acessibilidade, formulário, gráfico, tema e
React Native ficam separados, e o agent abre só o que o trabalho pedir.
