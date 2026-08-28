---
category: Formulário
---

# Slider

Escolha de valor numa faixa: desconto, prazo, tolerancia.

**Só vale quando o número exato não importa.** Se importa, o `NumberField` diz
mais e não pede pontaria: arrastar um pino até 37 e trabalho, digitar 37 não.

```tsx
<Slider defaultValue={25} max={50} label="Desconto" showValue />
```

O `label` é o nome que o leitor de tela lê no pino, e não só o texto acima
dele: um pino sem rótulo visível é que precisa de `thumbLabel`.

`format` escreve o número do `showValue` e o que o leitor de tela anuncia: o
nome de um formatador da casa, ou uma função sua para a unidade que só esta tela
tem.

```tsx
<Slider defaultValue={30} max={90} label="Prazo" showValue format={(dias) => `${dias} dias`} />
```

Com dois valores, vira faixa de dois pinos, e cada pino precisa do próprio
nome, senao o leitor de tela anuncia dois controles iguais:

```tsx
<Slider
  defaultValue={[20, 60]}
  label="Faixa de valor"
  showValue
  thumbLabel={['Valor minimo', 'Valor maximo']}
/>
```

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Slider` - anda por gesto e responde às ações do leitor de tela; um valor só, e `label` obrigatório. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
