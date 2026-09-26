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

## No React Native

Traduz, e vira stepper: menos, valor, mais, que é o idioma do toque. **O `min` nasce em 0**, e no web ele nasce sem piso. Não é descuido: o teclado numérico do iPhone (`number-pad`) não tem sinal de menos, então o número negativo só chegaria pelo botão de menos, e um campo que desce abaixo de zero por toque e não deixa digitar o mesmo valor é pior do que um campo que para no zero. Para aceitar negativo, passe `min` explícito: o stepper desce até ele.

Digitando, o `max` vale a cada tecla e o `min` só na saída do campo: com `min={10}`, digitar 25 passa pelo 2 sem virar 10. Com `step` fracionário o teclado vira `decimal-pad`, vírgula e ponto valem como separador, como no web, e o passo sai com as casas dele: 0,2 mais 0,1 dá 0,3. O resto da API também muda (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
