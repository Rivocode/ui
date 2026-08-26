---
category: Sobreposição
---

# Popover

Painel ancorado de conteúdo livre. A peça entre o `Tooltip`, que só mostra texto
curto, e o `Dialog`, que rouba a tela inteira.

Compõe com `PopoverTrigger`, `PopoverContent`, `PopoverTitle`,
`PopoverDescription` e `PopoverClose`.

`side`, `align` e `sideOffset` ficam no `PopoverContent`: quem escreve a tela
pensa neles junto com o conteúdo.

## No React Native

Não porta. O painel ancorado ao gatilho é um problema de tela estreita antes de ser um problema de toque: ele nasce debaixo do dedo que o abriu e não tem para onde fugir. No React Native o equivalente é o `Sheet`, que sobe de baixo e não disputa espaço com nada.
