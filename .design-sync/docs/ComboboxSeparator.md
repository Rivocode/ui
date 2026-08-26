---
category: Formulário
---

# ComboboxSeparator

A linha entre dois `ComboboxGroup` da lista.

É a irmã do `SelectSeparator`, e fecha a paridade com o `MenuSeparator`: as três
listas da biblioteca cortam do mesmo jeito. Como no `Select`, ela sai com
`role="presentation"` — um nó com papel próprio no meio das opções quebraria o
"opção 3 de 12" que o leitor de tela anuncia.

## Quando não usar

Enquanto a busca é o caminho principal, a linha decora e não orienta: quem digita
três letras nunca vê o corte, porque a lista filtrada some com ele. Ela serve à
lista parada, aberta e curta o bastante para ser lida de uma vez — e aí só entre
grupos que têm nome.
