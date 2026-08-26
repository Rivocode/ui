---
category: Navegação
---

# Breadcrumb

O caminho até onde a pessoa esta.

Encolhe sozinho: passando de `maxItems`, o meio vira reticencia. No celular
sobram as duas ultimas migalhas, porque caminho comprido rola para fora da tela e
ninguém le o começo.

O caminho entra por `items`, uma lista de `Crumb` — `{ label, href }`, com o
`href` de fora na última, que é onde a pessoa já está:

```tsx
const trilha: Crumb[] = [
  { label: 'Notas fiscais', href: '/notas' },
  { label: 'Nota 4813' },
]
```

A última não é link e leva `aria-current="page"`.
