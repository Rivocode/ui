---
category: Formulário
---

# Slider

Escolha de valor numa faixa: desconto, prazo, tolerancia.

**Só vale quando o número exato não importa.** Se importa, o `NumberField` diz
mais e não pede pontaria: arrastar um pino até 37 e trabalho, digitar 37 não.

```tsx
<Slider defaultValue={25} max={50} label="Desconto" showValue thumbLabel="Desconto" />
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
