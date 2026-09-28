---
category: Structure
---

# Collapsible

Hides and shows a block.

It is the `Accordion` of a single item, without the frame and without the
coordination between siblings. When there are several sections that close one
another, Accordion says more.

```tsx
<Collapsible>
  <CollapsibleTrigger>Dados de quem emite</CollapsibleTrigger>
  <CollapsiblePanel>RivoCode Tecnologia, 12.345.678/0001-99.</CollapsiblePanel>
</Collapsible>
```

The panel animates its height on its own, and stops animating when the system
asks for less motion.

## In React Native

Translates: `@rivocode/ui-native` exports `Collapsible` - `label` in place of `CollapsibleTrigger` and `CollapsiblePanel`; `open`/`onOpenChange` or `defaultOpen`, as on the web; the same motion as the `Accordion`. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
