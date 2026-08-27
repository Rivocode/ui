---
category: Estrutura
---

# DataTable

Tabela com os três estados que toda listagem tem e quase nenhuma trata:
carregando, erro e vazio.

Não conhece React Query, e isso é de propósito: entram três booleanos, e funciona
igual com `fetch` na mao, com SWR ou com server component.

A ordem importa: erro vence carregando, e vazio só vale depois que a consulta
voltou. Sem isso, uma nova busca sobre um erro pisca "nenhum resultado" antes de
mostrar o problema.

## Ordenar, buscar, paginar, selecionar

Tudo opt-in, tudo client-side, nada muda para quem não pedir:

- **`sortable` na coluna**: o cabeçalho vira botão que alterna crescente,
  decrescente, sem ordem. Quando `cell` devolve JSX, entregue o valor cru em
  `value`, senão a ordem compara o que estiver em `row[key]`.
- **`filter` na tabela**, filtro global controlado: o app põe o campo de busca
  onde a tela pedir e passa o texto; a tabela compara ignorando caixa e acento
  ("otica" acha "Ótica"). Sem resultado, uma linha discreta explica. O
  `empty` continua reservado para consulta que voltou vazia.
- **`pageSize`**, paginação com rodapé: "1–4 de 7" à esquerda, as páginas à
  direita. Filtrar ou reordenar volta para a primeira página.
- **`selectable`**: coluna de checkbox à esquerda, chaves do `rowKey`, aviso
  em `onValueChange`. Passe `value` para controlar de fora, ou `defaultValue`
  para só dizer com o que ela começa, o mesmo par do `Tree` e do `TreeSelect`.
  O checkbox do cabeçalho marca a página visível, não a lista inteira.

## A linha de totais

Toda listagem financeira brasileira termina em "Total: R$ 248,3K". Montada numa
`<div>` embaixo da tabela, essa linha perde o alinhamento das colunas (uma
`<div>` não participa do algoritmo de layout de tabela e não conhece a largura
de nenhuma delas) e, com `maxHeight`, some ao rolar.

O total é **por coluna**, e é o irmão do `cell` uma linha acima: onde o `cell`
resume uma linha, o `total` resume a coluna inteira. Basta uma coluna declarar
`total` para o `<tfoot>` existir; as outras saem em branco, alinhadas com quem
está em cima.

```tsx
const COLUMNS: Column<Invoice>[] = [
  { key: 'number', header: 'Número', total: () => 'Total' },
  { key: 'customer', header: 'Cliente' },
  {
    key: 'amount',
    header: 'Valor',
    align: 'right',
    cell: (invoice) => currencyShort(invoice.amount),
    total: (invoices) => currencyShort(invoices.reduce((sum, i) => sum + i.amount, 0)),
  },
]
```

Alinhamento à direita, `hideOnMobile` e o grudar embaixo com `maxHeight` vêm de
graça: a célula do total já é a célula daquela coluna. **O dinheiro sai
abreviado**, como no resto da casa: `currency` por extenso fica para onde o
centavo é o assunto.

**As linhas que chegam ao `total` são as que sobraram do filtro, de todas as
páginas.** O rodapé de paginação ao lado já conta assim ("1–4 de 7" conta o que
sobrou da busca), e um total que mudasse a cada virada de página não seria um
total de nada. Carregando não há rodapé (não há o que somar), e busca sem
resultado também não: a linha que explica já ocupa a tabela inteira.

Por que não um `footer?: (rows) => ReactNode`: ele devolveria o problema de onde
ele veio. Quem escrevesse teria de montar a `<tr>` e as `<td>` na mão, contar as
colunas escondidas no celular e repetir o alinhamento de cada uma, e errar em
qualquer um desses é voltar a ter o total fora de eixo, agora dentro de uma
tabela. Para o arranjo que uma coluna não alcança (célula que junta duas
colunas, duas linhas de resumo), o caminho é o `Table` com `TableFooter`, que
existe justamente para a tabela que você desenha.

`classNames.footer` continua sendo a barra de paginação debaixo da tabela, e não
esta linha: a linha de totais se veste pelo que o `total` de cada coluna
devolve.

## Os textos que a peça escreve

Eram cravados, e nenhum tinha prop:

- **`errorTitle`** (padrão "Não foi possível carregar") e **`errorMessage`** são
  o par do estado de erro. Uma tela que carrega três listagens precisa dizer
  qual delas falhou. O `ChartContainer` usa os mesmos dois nomes.
- **`retryLabel`** (padrão "Tentar de novo") é o nome do botão que executa o
  `onRetry`. Ele existe pelo mesmo motivo do `errorTitle`, e com o mesmo nome
  nas quatro peças de consulta: sem ele, a tela em outra língua saía com o
  título traduzido e o botão em português.
- **`noResultsMessage`** (padrão "Nenhum resultado para a busca.") é a linha
  discreta de quando o filtro zerou. Ela não se confunde com o `empty`: filtro
  que zerou não é consulta vazia, e o remédio de um (limpar a busca) não serve
  ao outro.

`errorTitle`, `errorMessage` e `noResultsMessage` valem igual no `DataList` do
React Native, com uma diferença de padrão: lá o aviso de erro nasceu de uma linha só, então `errorTitle` aparece
apenas quando você passa um. Sem ele, quem fala é a `errorMessage`.

## Muita linha: rolagem própria e virtualização

Entre "cabe numa página" e "manda para o servidor" existe o caso do meio, que é
onde mora um painel de log: dezenas de milhares de linhas, e ainda assim
ordenar e buscar precisam funcionar. Paginar no servidor resolve o volume e
custa `sortable` e `filter`: a peça volta a ser tabela crua.

```tsx
<DataTable
  data={events}          // 80 mil linhas
  columns={COLUMNS}      // com sortable à vontade
  rowKey={(event) => event.id}
  filter={search}
  maxHeight={480}
  virtual
/>
```

São duas props, e elas são independentes de propósito:

- **`maxHeight`** dá à tabela uma moldura com rolagem própria: ela rola por
  dentro em vez de empurrar a página, e o cabeçalho gruda no topo dessa moldura
  (`--rc-z-sticky`, abaixo de menu, diálogo e toast). Sozinha, ela não
  virtualiza nada: todas as linhas continuam no DOM, e isso basta até uns
  poucos milhares.
- **`virtual`** desenha só as linhas que cabem na moldura. Precisa de
  `maxHeight`: sem altura não há o que caber. Não combine com `pageSize`:
  paginar já resolve o mesmo problema de outro jeito.
- **`rowHeight`** (padrão 44) é a altura da linha virtualizada, e a peça a
  aplica. Não é chute: o espaço de quem não foi desenhado sai dessa
  multiplicação, e linha que cresce faz a rolagem prometer um fim que não
  chega. Numa lista densa, ou com célula de duas linhas, passe a sua.

**Ela continua saindo como `<table>` de verdade.** O jeito comum de virtualizar
(cada linha em `position: absolute` com `translateY`) quebraria isso: linha
absoluta sai do algoritmo de layout de tabela, e com ela vão a largura de coluna
compartilhada e o alinhamento entre cabeçalho e célula. O que sobra é uma grade
de `div` com cara de tabela. Aqui as linhas visíveis ficam em fluxo normal e o
espaço de quem não foi desenhado vira duas linhas vazias, uma antes e uma
depois, com a altura que falta. O `<tbody>` continua tendo só `<tr>` por filho,
e cada `<tr>` só `<td>`.

As linhas vazias saem do fluxo do leitor de tela com `aria-hidden`, e quem
carrega a contagem certa é o `aria-rowcount` da tabela mais o `aria-rowindex` de
cada linha, senão a lista seria anunciada como "12 linhas" no meio de oitenta
mil.

Quem ordena, filtra ou pagina **no servidor** já recebe os dados prontos: mostre
a página que veio e ponha o `Pagination` da casa do lado de fora, e não marque
`sortable` nem use `filter`, porque duas ordenações discordando é pior que uma.

## A espera se anuncia

**A espera se anuncia em voz alta.** `aria-busy` num nó sem papel não é lido por
leitor de tela nenhum: ele descreve o estado de uma região, e só chega a quem já
está dentro dela. Quem esperava ouvia silêncio, e a chegada do dado, que troca a
tela inteira, também não dizia nada. As quatro irmãs publicam a mesma região viva
(`role="status" aria-live="polite"`, marcada com `data-rc-status`), que diz
"Carregando…" enquanto a consulta não volta e "Conteúdo carregado" quando ela
volta. Ela existe antes de o texto mudar e é o mesmo nó do primeiro ao último
estado: região que nasce já com o texto dentro não dispara anúncio nenhum.

## Quando não usar

Para a tabela que você desenha linha a linha, use `Table`. Ela compõe com
`TableRow`, `TableCell` e `TableFooter`, e aceita qualquer arranjo: célula que
junta duas colunas, duas linhas de resumo, o quadro de um recibo. Esta aqui
recebe `columns` e `rows`, e essa é a troca: ela cuida dos estados e da ordenação, e em compensação
o desenho de cada linha passa a caber no que uma coluna sabe fazer.

## No React Native

Vira `DataList`. Tabela não existe no celular: o que atravessa é a máquina de estados (carregando, erro, vazio, dados) na mesma ordem, com o erro vencendo o carregando e o vazio valendo só depois que a resposta chegou. Os textos desses finais se configuram com os nomes do web: `errorTitle`, `errorMessage` e `noResultsMessage`. Só o padrão de `errorTitle` difere: aqui não há, porque o aviso da lista nasceu de uma linha só, e essa linha é a `errorMessage`. Dos quatro opt-in daqui, dois portam com o mesmo nome de prop (`filter` e `selectable`) e **dois não portam por desenho**: ordenação e `pageSize`. Cabeçalho clicável não existe sem cabeçalho, e no celular ordenar é um `Menu` de "ordenar por" que a tela monta em cima da lista. No lugar das colunas, `renderItem`. E por isso o `filter` quer um `filterValue`, já que ninguém consegue ler texto de dentro do JSX que você devolve.
