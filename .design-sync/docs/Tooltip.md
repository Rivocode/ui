---
category: Sobreposição
---

# Tooltip

Dica curta, para botão que só tem ícone.

Compõe com `TooltipTrigger` e `TooltipContent`.

Não guarde informação essencial aqui: dica não aparece no toque e não é lida em
todo contexto. O `aria-label` do botão continua obrigatório.

Para o caso mais comum, a dica que repete o nome de um botão só com ícone, use
`IconButton` com `tooltip`: ele monta a dica com o `label` e não a amarra por
`aria-describedby`, então o leitor de tela não ouve a mesma frase duas vezes.

## No React Native

Não porta, e não há substituto: a dica aparece ao pousar o ponteiro, e no toque não existe pousar. O que no web era um ícone com dica vira, no celular, um ícone com rótulo escrito ao lado, ou um `accessibilityLabel`, que resolve para o leitor de tela e não resolve para quem enxerga.
