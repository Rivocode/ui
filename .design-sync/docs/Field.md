---
category: Formulário
---

# Field

Raiz do campo de formulário. Liga rótulo, ajuda e erro por acessibilidade.

Compõe com `FieldLabel`, `Input`, `FieldDescription` e `FieldError`. A ligacao e
automática: não escreva `htmlFor` nem `aria-describedby` a mao.

Marque inválido com `invalid` na raiz e mostre a mensagem com
`<FieldError match>`. `disabled` na raiz desabilita o conjunto.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Field` - `label`, `description` e `error` como props; o erro vence a descrição, como no web. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
