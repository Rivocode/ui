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

- **`sortable` na coluna** — o cabeçalho vira botão que alterna crescente,
  decrescente, sem ordem. Quando `cell` devolve JSX, entregue o valor cru em
  `value`, senão a ordem compara o que estiver em `row[key]`.
- **`filter` na tabela** — filtro global controlado: o app põe o campo de busca
  onde a tela pedir e passa o texto; a tabela compara ignorando caixa e acento
  ("otica" acha "Ótica"). Sem resultado, uma linha discreta explica — o
  `empty` continua reservado para consulta que voltou vazia.
- **`pageSize`** — paginação com rodapé: "1–4 de 7" à esquerda, as páginas à
  direita. Filtrar ou reordenar volta para a primeira página.
- **`selectable`** — coluna de checkbox à esquerda, chaves do `rowKey`, aviso
  em `onValueChange`. Passe `value` para controlar de fora, ou `defaultValue`
  para só dizer com o que ela começa — o mesmo par do `Tree` e do `TreeSelect`.
  Os nomes antigos, `selected` e `onSelectedChange`, continuam funcionando e
  saem numa versão maior. O checkbox do cabeçalho marca a página visível, não a
  lista inteira.

## Muita linha: rolagem própria e virtualização

Entre "cabe numa página" e "manda para o servidor" existe o caso do meio, que é
onde mora um painel de log: dezenas de milhares de linhas, e ainda assim
ordenar e buscar precisam funcionar. Paginar no servidor resolve o volume e
custa `sortable` e `filter` — a peça volta a ser tabela crua.

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
  virtualiza nada — todas as linhas continuam no DOM, e isso basta até uns
  poucos milhares.
- **`virtual`** desenha só as linhas que cabem na moldura. Precisa de
  `maxHeight`: sem altura não há o que caber. Não combine com `pageSize` —
  paginar já resolve o mesmo problema de outro jeito.
- **`rowHeight`** (padrão 44) é a altura da linha virtualizada, e a peça a
  aplica. Não é chute: o espaço de quem não foi desenhado sai dessa
  multiplicação, e linha que cresce faz a rolagem prometer um fim que não
  chega. Numa lista densa, ou com célula de duas linhas, passe a sua.

**Ela continua saindo como `<table>` de verdade.** O jeito comum de virtualizar
— cada linha em `position: absolute` com `translateY` — quebraria isso: linha
absoluta sai do algoritmo de layout de tabela, e com ela vão a largura de coluna
compartilhada e o alinhamento entre cabeçalho e célula. O que sobra é uma grade
de `div` com cara de tabela. Aqui as linhas visíveis ficam em fluxo normal e o
espaço de quem não foi desenhado vira duas linhas vazias, uma antes e uma
depois, com a altura que falta. O `<tbody>` continua tendo só `<tr>` por filho,
e cada `<tr>` só `<td>`.

As linhas vazias saem do fluxo do leitor de tela com `aria-hidden`, e quem
carrega a contagem certa é o `aria-rowcount` da tabela mais o `aria-rowindex` de
cada linha — senão a lista seria anunciada como "12 linhas" no meio de oitenta
mil.

Quem ordena, filtra ou pagina **no servidor** já recebe os dados prontos: mostre
a página que veio e ponha o `Pagination` da casa do lado de fora — e não marque
`sortable` nem use `filter`, porque duas ordenações discordando é pior que uma.

## Quando não usar

Para a tabela que você desenha linha a linha, use `Table`. Ela compõe com
`TableRow` e `TableCell` e aceita qualquer arranjo — célula que junta duas
colunas, linha de total, quadro de um recibo. Esta aqui recebe `columns` e
`rows`, e essa é a troca: ela cuida dos estados e da ordenação, e em compensação
o desenho de cada linha passa a caber no que uma coluna sabe fazer.

## No React Native

Vira `DataList`. Tabela não existe no celular: o que atravessa é a máquina de estados — carregando, erro, vazio, dados — na mesma ordem, com o erro vencendo o carregando e o vazio valendo só after que a resposta chegou. Dos quatro opt-in daqui, dois portam com o mesmo nome de prop (`filter` e `selectable`) e **dois não portam por desenho**: ordenação e `pageSize`. Cabeçalho clicável não existe sem cabeçalho, e no celular ordenar é um `Menu` de "ordenar por" que a tela monta em cima da lista. No lugar das colunas, `renderItem` — e por isso o `filter` quer um `filterValue`, já que ninguém consegue ler texto de dentro do JSX que você devolve.
