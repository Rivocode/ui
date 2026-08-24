---
category: Formulario
---

# Field

Raiz do campo de formulario. Liga rotulo, ajuda e erro por acessibilidade.

Compoe com `FieldLabel`, `Input`, `FieldDescription` e `FieldError`. A ligacao e
automatica: nao escreva `htmlFor` nem `aria-describedby` a mao.

Marque invalido com `invalid` na raiz e mostre a mensagem com
`<FieldError match>`. `disabled` na raiz desabilita o conjunto.
