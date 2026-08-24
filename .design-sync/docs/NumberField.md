---
category: Formulário
---

# NumberField

Campo de número com mais e menos.

Use quando o valor tem passo e limite conhecidos: quantidade, parcelas, dias de
prazo. Para dinheiro, o `MaskedInput` com molde de moeda diz mais, porque ali o
que importa e a pontuacao e não o passo.

O `Input` cru continua servindo para número solto. A diferença aqui e que seta
do teclado, rolagem e os botões respeitam `min`, `max` e `step`, o campo nunca
chega num valor que o formulário rejeita depois.

```tsx
<Field>
  <FieldLabel>Parcelas</FieldLabel>
  <NumberField defaultValue={3} min={1} max={12} />
  <FieldDescription>De 1 a 12, sem juros.</FieldDescription>
</Field>
```
