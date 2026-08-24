---
category: Formulário
---

# Select

Escolha única em lista.

Compõe com `SelectTrigger`, `SelectValue`, `SelectContent` e `SelectItem`.

**Passe `items` com `{ label, value }` na raiz.** Sem isso o gatilho mostra o
valor cru em vez do rótulo, e essa é a armadilha mais fácil de cair aqui.

Renderiza em portal, então exige o `RivoProvider`.
