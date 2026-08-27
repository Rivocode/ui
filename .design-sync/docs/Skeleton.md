---
category: Feedback
---

# Skeleton

Marca de lugar enquanto o dado não chegou.

Da a forma com utilitarios: `<Skeleton className="h-4 w-40" />`. Reproduza o
formato do conteúdo que vai chegar, senao a tela pula quando ele chega.

Fica escondido do leitor de tela de propósito. Marque o container com
`aria-busy="true"`, que é onde o aviso de carregamento pertence. Respeita
`prefers-reduced-motion`.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Skeleton` - mesma marca de lugar, mesmo token. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
