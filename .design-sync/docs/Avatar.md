---
category: Estrutura
---

# Avatar

Foto de pessoa, com a inicial por trás.

A inicial não aparece de imediato: a Base UI espera um instante, para a foto que
carrega rápido não piscar a letra antes.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Avatar` - `src` remoto pela `Image` do core; `fallback` é obrigatório, porque é ele que aparece enquanto a foto baixa e se ela falhar. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
