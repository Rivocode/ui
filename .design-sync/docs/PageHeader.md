---
category: Estrutura
---

# PageHeader

O topo que toda rota reescreve um pouco diferente: trilha, título, descrição
e as ações da tela, na mesma hierarquia em todas as páginas.

O título sai num `<h1>` de propósito — cabeçalho de página é o topo dela, e
começar a página num `h2` deixa um buraco que o leitor de tela sente. A
trilha entra pelo slot `breadcrumb`, com o `Breadcrumb` da casa; as ações
entram por `actions` e ficam à direita, quebrando de linha no estreito antes
de espremer o título.
