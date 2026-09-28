---
category: Estrutura
---

# Accordion

Sanfona, para perguntas frequentes e para secoes longas de formulário.

O `AccordionItem` entrega cabeçalho, gatilho e painel numa peça só, porque a
Base UI exige a ordem exata entre eles e expor as partes soltas só criaria um
jeito de montar errado.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Accordion` - `value`, `defaultValue` e `onValueChange` na raiz, pelo `value` de cada `AccordionItem`; um aberto por vez, como no web (`multiple` deixa vários), e item sem `value` abre sozinho. Abre com a seta girando e o corpo em fade, e sem movimento quando o sistema pede para reduzir. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
