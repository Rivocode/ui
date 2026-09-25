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

Traduz: o `@rivocode/ui-native` exporta `Field` - `label`, `description` e `error` como props; `validate`, `validationMode` e `validationDebounceTime` com o nome, a assinatura e o momento do web, e o `error` explícito vence o `validate`; o `validate` recebe o texto dos campos de digitar (`Input`, `Textarea`, `MaskedInput`, `InputGroup`, `PasswordInput`), e o erro é anunciado, acende a borda deles e vira a dica; o seletor que abre folha (`Select`, `Combobox`, `DatePicker`) não fala com o `Field`. O texto que chega depois entra por fade. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
