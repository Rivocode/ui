---
category: Estrutura
---

# CardTitle

O nome do cartão, na fonte de display.

Sai como `<h3>`. Se o cartão viver dentro de uma seção com outro nível de
heading, troque a tag com `render` em vez de deixar a ordem quebrada. O caso
mais comum é o painel: os cartões vêm logo abaixo do `h1` da página, e pular
para `h3` reprova a ordem de títulos do Lighthouse e do axe.

```tsx
<Card>
  <CardHeader>
    <CardTitle render={<h2 />}>Sobra ao longo do ano</CardTitle>
  </CardHeader>
</Card>
```
