---
category: Feedback
---

# Skeleton

Marca de lugar enquanto o dado nao chegou.

Da a forma com utilitarios: `<Skeleton className="h-4 w-40" />`. Reproduza o
formato do conteudo que vai chegar, senao a tela pula quando ele chega.

Fica escondido do leitor de tela de proposito. Marque o container com
`aria-busy="true"`, que e onde o aviso de carregamento pertence. Respeita
`prefers-reduced-motion`.
