---
category: Formulário
---

# Field

Raiz do campo de formulário. Liga rótulo, ajuda e erro por acessibilidade.

Compõe com `FieldLabel`, `Input`, `FieldDescription` e `FieldError`. A ligacao e
automática: não escreva `htmlFor` nem `aria-describedby` a mao.

Marque inválido com `invalid` na raiz e mostre a mensagem com
`<FieldError match>`. `disabled` na raiz desabilita o conjunto.
