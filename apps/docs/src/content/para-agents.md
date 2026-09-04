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

## Os quatro endereços

| Endereço                       | O que entrega                                              |
| ------------------------------ | ---------------------------------------------------------- |
| `/skill/SKILL.md`              | a skill crua, para ler sem instalar                        |
| `/llms.txt`                    | o índice, por família, com link para cada documento        |
| `/componentes/<nome>.md`       | o documento de uma peça, cru                               |
| `/convencoes.md`               | o contrato da biblioteca: Provider, tokens, vocabulário    |

O nome no endereço é o mesmo da página: `ToggleGroup` mora em
`/componentes/toggle-group`, e o markdown dele em
`/componentes/toggle-group.md`.

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
arquivo — o método de montar uma tela, layout, design, escolha de peça,
acessibilidade, formulário, gráfico, tema e React Native ficam separados, e o
agent abre só o que o trabalho pedir.
