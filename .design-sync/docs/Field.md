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

Traduz: o `@rivocode/ui-native` exporta `Field` - `label`, `description` e `error` como props; `validate`, `validationMode` e `validationDebounceTime` com o nome, a assinatura e o momento do web, e o `error` explícito vence o `validate`; o erro é anunciado, vira a dica do controle, e o texto que chega depois entra por fade. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
