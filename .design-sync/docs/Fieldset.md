---
category: Forms
---

# Fieldset

Groups fields that answer the same question: address, customer details,
payment.

The legend is not just a title: the screen reader announces it together with
the label of each field inside. "Número" alone says nothing; "Endereco,
número" does.

```tsx
<Fieldset>
  <FieldsetLegend>Endereco</FieldsetLegend>

  <Field>
    <FieldLabel>Rua</FieldLabel>
    <Input placeholder="Av. Epitacio Pessoa" />
  </Field>

  <Field>
    <FieldLabel>Numero</FieldLabel>
    <Input placeholder="1200" />
  </Field>
</Fieldset>
```

The spacing between groups is larger than the spacing between fields, on
purpose: it is what shows where one subject ends.

## In React Native

Translates: `@rivocode/ui-native` exports `Fieldset` - `legend` as a prop. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
