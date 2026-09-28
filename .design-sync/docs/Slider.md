---
category: Forms
---

# Slider

Choosing a value within a range: discount, deadline, tolerance.

**It only works when the exact number does not matter.** If it does,
`NumberField` says more and asks for no aim: dragging a thumb to 37 is work,
typing 37 is not.

```tsx
<Slider defaultValue={25} max={50} label="Desconto" showValue />
```

`label` is the name the screen reader reads on the thumb, and not just the text
above it: a thumb with no visible label is the one that needs `thumbLabel`.

`format` writes the `showValue` number and what the screen reader announces:
the name of a house formatter, or a function of yours for the unit only this
screen has.

```tsx
<Slider defaultValue={30} max={90} label="Prazo" showValue format={(dias) => `${dias} dias`} />
```

With two values, it becomes a two-thumb range, and each thumb needs its own
name, otherwise the screen reader announces two identical controls:

```tsx
<Slider
  defaultValue={[20, 60]}
  label="Faixa de valor"
  showValue
  thumbLabel={['Valor minimo', 'Valor maximo']}
/>
```

## In React Native

Translates: `@rivocode/ui-native` exports `Slider` - moves by gesture and responds to screen reader actions; a single value, `label` required, and `showValue` and `format` as on the web; `classNames` with the web's six parts. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
