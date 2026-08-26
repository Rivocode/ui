---
category: Sobreposição
---

# Tooltip

Dica curta, para botão que só tem ícone.

Compõe com `TooltipTrigger` e `TooltipContent`.

Não guarde informação essencial aqui: dica não aparece no toque e não é lida em
todo contexto. O `aria-label` do botão continua obrigatório.

## No React Native

Não porta, e não há substituto: a dica aparece ao pousar o ponteiro, e no toque não existe pousar. O que no web era um ícone com dica vira, no celular, um ícone com rótulo escrito ao lado — ou um `accessibilityLabel`, que resolve para o leitor de tela e não resolve para quem enxerga.
