---
category: Navegação
---

# Pagination

Navegação entre páginas de uma listagem.

A lista de números encolhe sozinha, então ela ocupa a mesma largura com dez ou
com dez mil páginas. No celular os números somem e ficam só as setas com "3 de
12": alvo de 32px erra o vizinho, e quase sempre se quer a proxima.

`onPageChange` recebe a página nova, contando de 1; quem troca o `page` é quem
chamou. Os textos moram em `labels`: `navigation` é o nome da região, `previous`
e `next` os das setas, `page` o de cada número e `position` o "3 de 12" da tela
estreita. No `DataTable` com `pageSize`, eles chegam por `labels.pagination`.

Nas bordas a peça não mente: `pageCount` abaixo de 1 conta como uma página, o
`page` fora da faixa aparece preso a ela (9 de 5 sai "5 de 5", com o 5 marcado
e a seta de voltar indo para o 4), e com uma página só as duas setas ficam
travadas.

## No React Native

Não porta, por decisão - lista de celular rola; escolher o número da página é gesto de mesa. Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de cada uma.
