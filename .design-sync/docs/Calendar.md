---
category: Formulário
---

# Calendar

O mes cru, para quem quer o calendário na própria tela.

E a única peça do catalogo com fundacao de fora, a `react-day-picker`, e ela
entra só como motor: nenhuma folha de estilo dela e importada, todo o desenho vem
dos nossos tokens. O locale padrão e `pt-BR`.

Em largura de celular mostra um mes só, mesmo quando pedem mais, e o dia ganha
44px de alvo. Na tela mais estreita que isso, abaixo de uns 360px, o dia encolhe
junto com a tela para as sete colunas caberem sem rolar para o lado: a 320px
cada dia fica com uns 38px, ainda acima dos 24 da WCAG 2.5.8.

A troca de mês anima: o mês novo entra pelo lado para onde a pessoa andou, em
200ms, e com "reduzir movimento" ligado a troca é instantânea. `animate={false}`
desliga.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Calendar` - mês desenhado à mão; valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa`; o mês novo entra por fade. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
