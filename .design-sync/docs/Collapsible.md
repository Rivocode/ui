---
category: Estrutura
---

# Collapsible

Esconde e mostra um bloco.

E o `Accordion` de um item só, sem a moldura e sem a coordenacao entre irmaos.
Quando ha várias secoes que se fecham entre si, o Accordion diz mais.

```tsx
<Collapsible>
  <CollapsibleTrigger>Dados de quem emite</CollapsibleTrigger>
  <CollapsiblePanel>RivoCode Tecnologia, 12.345.678/0001-99.</CollapsiblePanel>
</Collapsible>
```

O painel anima altura sozinho, e para de animar quando o sistema pede menos
movimento.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Collapsible` - `label` no lugar de `CollapsibleTrigger` e `CollapsiblePanel`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
