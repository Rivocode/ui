---
category: Formulário
---

# Input

Controle de texto. Vive dentro de `Field`.

`size`: `sm`, `md` (padrão) e `lg`, todos lendo a altura do token de densidade.
O atributo `size` nativo do HTML não existe aqui de propósito, porque colidiria
com a variante.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Input` — a borda acende no foco — não há `focus-visible` em tela de toque. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
