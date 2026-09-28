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

Traduz: o `@rivocode/ui-native` exporta `Field` - `label`, `description` e `error` como props, e o `label` nomeia o campo de digitar que está dentro; `validate`, `validationMode` e `validationDebounceTime` com o nome, a assinatura e o momento do web, e o `error` explícito vence o `validate`; o `validate` recebe o texto dos campos de digitar (`Input`, `Textarea`, `MaskedInput`, `InputGroup`, `PasswordInput`) e o valor dos que abrem folha (`Autocomplete`, `Select`, `Combobox`, `DatePicker`), e o erro é anunciado, acende a borda deles e vira a dica; nos de folha, fechar a folha é a saída do campo, e o `Concluir` e a tecla de envio são o envio. O texto que chega depois entra por fade. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
