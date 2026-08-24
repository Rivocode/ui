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
