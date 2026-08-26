---
category: Formulário
---

# OTPField

Código de verificacao, uma casa por digito.

**Colar o código inteiro funciona**: a Base UI espalha os digitos pelas casas em
vez de jogar tudo na primeira. E quase sempre assim que o código chega, vindo do
SMS ou do e-mail.

O teclado de números e o preenchimento pelo SMS já vem prontos, num input
escondido que guarda o código inteiro. As casas visíveis só mostram.

```tsx
<OTPField length={6} onValueChange={(codigo) => conferir(codigo)} />
```

## No React Native

Traduz: o `@rivocode/ui-native` exporta `OTPField` — caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
