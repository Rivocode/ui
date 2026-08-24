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
