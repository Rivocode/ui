---
category: Formulário
---

# ComboboxChip

Uma escolha, com o xis de tirar.

O xis por dentro diz o que se remove. Quando a ficha é texto, o nome sai pronto
do próprio conteúdo ("Remover Clínica São Lucas"), e quando ela não é (um
`Avatar`, um `Badge`), o `aria-label` da ficha é que responde. Sem um dos dois o
leitor de tela lê uma fila de "Remover, Remover, Remover", e a WCAG 2.4.6 pede
que o nome distinga.

`labels.remove` recebe o texto da ficha e devolve o nome, para trocar o verbo ou
traduzir:

```tsx
<ComboboxChip labels={{ remove: (label) => `Tirar ${label} da seleção` }}>
  Clínica São Lucas
</ComboboxChip>
```
