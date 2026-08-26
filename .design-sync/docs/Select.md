---
category: Formulário
---

# Select

Escolha única em lista.

Compõe com `SelectTrigger`, `SelectValue`, `SelectContent` e `SelectItem`.

**Passe `items` com `{ label, value }` na raiz.** Sem isso o gatilho mostra o
valor cru em vez do rótulo, e essa é a armadilha mais fácil de cair aqui.

Renderiza em portal, então exige o `RivoProvider`.

## Quando não usar

Quando a lista é grande demais para caber na cabeça de quem escolhe, ou quando
ela vem do servidor, use `Combobox`: ele traz a busca junto. Rolar cento e
vinte cidades numa lista sem campo de digitar é o mesmo trabalho de procurar
numa gaveta.

Para duas ou três opções que cabem lado a lado, o `RadioGroup` mostra todas de
uma vez e economiza o clique de abrir — e para um liga-desliga, o `Switch`.
