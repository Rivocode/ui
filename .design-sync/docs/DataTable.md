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
