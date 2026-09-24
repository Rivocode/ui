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
<Field className="w-fit max-w-full">
  <FieldLabel>Código de verificação</FieldLabel>
  <OTPField length={6} onValueChange={(codigo) => conferir(codigo)} />
</Field>
```

O `FieldLabel` em volta dá nome ao primeiro dígito, que é o que recebe o código
colado: a Base UI reserva o rótulo dele para o rótulo do campo, e as outras
casas se anunciam pela posição ("Dígito 2 de 6"). Na tela estreita as casas
encolhem até 32 pixels cada, em vez de empurrar a página para o lado.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `OTPField` - caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só; o dígito aparece crescendo. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
