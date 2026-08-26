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
- **`selectable`** — coluna de checkbox à esquerda, chaves do `rowKey`,
  aviso em `onSelectedChange`. Passe `selected` para controlar de fora. O
  checkbox do cabeçalho marca a página visível, não a lista inteira.

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

Vira `DataList`. Tabela não existe no celular: o que atravessa é a máquina de estados — carregando, erro, vazio, dados — na mesma ordem, com o erro vencendo o carregando e o vazio valendo só depois que a resposta chegou. Dos quatro opt-in daqui, dois portam com o mesmo nome de prop (`filter` e `selectable`) e **dois não portam por desenho**: ordenação e `pageSize`. Cabeçalho clicável não existe sem cabeçalho, e no celular ordenar é um `Menu` de "ordenar por" que a tela monta em cima da lista. No lugar das colunas, `renderItem` — e por isso o `filter` quer um `filterValue`, já que ninguém consegue ler texto de dentro do JSX que você devolve.
