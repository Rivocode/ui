---
category: Formulario
---

# Select

Escolha unica em lista.

Compoe com `SelectTrigger`, `SelectValue`, `SelectContent` e `SelectItem`.

**Passe `items` com `{ label, value }` na raiz.** Sem isso o gatilho mostra o
valor cru em vez do rotulo, e essa e a armadilha mais facil de cair aqui.

Renderiza em portal, entao exige o `RivoProvider`.
