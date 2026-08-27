---
category: Estrutura
---

# Accordion

Sanfona, para perguntas frequentes e para secoes longas de formulário.

O `AccordionItem` entrega cabeçalho, gatilho e painel numa peça só, porque a
Base UI exige a ordem exata entre eles e expor as partes soltas só criaria um
jeito de montar errado.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Accordion` - cada `AccordionItem` guarda o próprio aberto; não há raiz controlada. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
