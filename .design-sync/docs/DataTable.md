---
category: Estrutura
---

# DataTable

Tabela com os tres estados que toda listagem tem e quase nenhuma trata:
carregando, erro e vazio.

Nao conhece React Query, e isso e de proposito: entram tres booleanos, e funciona
igual com `fetch` na mao, com SWR ou com server component.

A ordem importa: erro vence carregando, e vazio so vale depois que a consulta
voltou. Sem isso, uma nova busca sobre um erro pisca "nenhum resultado" antes de
mostrar o problema.
