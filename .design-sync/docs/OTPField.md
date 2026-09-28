---
category: Forms
---

# OTPField

A verification code, one slot per digit.

**Pasting the whole code works**: Base UI spreads the digits across the slots
instead of dumping everything into the first one. That is almost always how the
code arrives, from the SMS or the e-mail.

The numeric keyboard and SMS autofill come ready, in a hidden input that holds
the whole code. The visible slots only display.

```tsx
<Field className="w-fit max-w-full">
  <FieldLabel>Código de verificação</FieldLabel>
  <OTPField length={6} onValueChange={(codigo) => conferir(codigo)} />
</Field>
```

The `FieldLabel` around it names the first digit, which is the one that
receives the pasted code: Base UI reserves its label for the field's label,
and the other slots announce themselves by position ("Dígito 2 de 6"). On a
narrow screen the slots shrink down to 32 pixels each, instead of pushing the
page sideways.

## In React Native

Translates: `@rivocode/ui-native` exports `OTPField` - visible boxes, one hidden field: keyboard, SMS autofill and screen reader see just one; the digit grows in; `label` names the field. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
