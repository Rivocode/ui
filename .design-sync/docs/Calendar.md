---
category: Formulário
---

# Calendar

O mes cru, para quem quer o calendário na própria tela.

E a única peça do catalogo com fundacao de fora, a `react-day-picker`, e ela
entra só como motor: nenhuma folha de estilo dela e importada, todo o desenho vem
dos nossos tokens. O locale padrão e `pt-BR`.

Em largura de celular mostra um mes só, mesmo quando pedem mais, e o dia ganha
44px de alvo.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Calendar` — mês desenhado à mão; valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
