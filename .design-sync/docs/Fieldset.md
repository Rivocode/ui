---
category: Formulário
---

# Fieldset

Agrupa campos que respondem a mesma pergunta: endereco, dados do cliente,
pagamento.

A legenda não é só título: o leitor de tela anuncia ela junto com o rótulo de
cada campo dentro. "Número" sozinho não diz nada; "Endereco, número" diz.

```tsx
<FieldsetRoot>
  <FieldsetLegend>Endereco</FieldsetLegend>

  <Field>
    <FieldLabel>Rua</FieldLabel>
    <Input placeholder="Av. Epitacio Pessoa" />
  </Field>

  <Field>
    <FieldLabel>Numero</FieldLabel>
    <Input placeholder="1200" />
  </Field>
</FieldsetRoot>
```

O respiro entre grupos e maior que o respiro entre campos, de propósito: e ele
que mostra onde um assunto termina.
