---
category: Estrutura
---

# TableCaption

A legenda da tabela, num `<caption>` de verdade. É o nome que o leitor de tela
anuncia antes de entrar nas linhas.

Ela vai **dentro** do `Table`, e como primeiro filho:

```tsx
<Table>
  <TableCaption>Notas emitidas em junho de 2025</TableCaption>
  <TableHeader>…</TableHeader>
  <TableBody>…</TableBody>
  <TableFooter>…</TableFooter>
</Table>
```

O instinto é escrever esse título numa `<p>` ou num `<h3>` logo acima da
tabela. Não quebra nada, e custa o nome inteiro: o anúncio vira "tabela, 5
colunas, 12 linhas" e mais nada, porque texto vizinho não nomeia elemento
nenhum. Numa tela com duas tabelas — a das notas e a dos pagamentos — quem
navega por lista de tabelas ouve as duas com o mesmo nome, que é nome nenhum.

E não há meio-termo: `<caption>` não tem outro pai legal além de `<table>`.
Solto ao lado do `Table`, onde o título parece caber melhor, o React derruba a
tela:

```
In HTML, <caption> cannot be a child of <div>. This will cause a hydration error.
```

Ou é filho da `<table>`, ou não é legenda.

Quando a tabela já tem um título na página, a legenda continua valendo a pena
como nome, só que sem ocupar pixel nenhum:

```tsx
<TableCaption className="sr-only">Notas emitidas em junho de 2025</TableCaption>
```

É o que o `DataTable` faz com o `caption` dele.

A legenda sai em cima. Para mandá-la para baixo da tabela, `caption-bottom` na
classe — o `caption-top` da peça sai do caminho sozinho.

## Quando não usar

Numa listagem que vem de uma consulta, não monte o `<caption>` à mão: o
`DataTable` recebe a legenda pela prop `caption`, e já a escreve dentro da
`<table>` certa — inclusive na variante com altura, onde a tabela é outra.

Para o título visível que encabeça a seção inteira, com ação do lado, é o
`PageHeader`, e não a legenda: `TableCaption` nomeia a tabela, não a tela.
