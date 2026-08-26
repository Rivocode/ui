---
category: Estrutura
---

# Card

Superfície que agrupa conteúdo relacionado.

Compõe com `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` e
`CardFooter`. O título sai como `<h3>`, então respeita a hierarquia da página.

`elevation="flat"` (padrão) fica sobre o fundo. `raised` ganha sombra, para o que
precisa saltar. Não empilhe elevacoes: se tudo salta, nada salta.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Card` — com `CardHeader`, `CardTitle`, `CardDescription` e `CardContent` — sem `CardFooter`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
