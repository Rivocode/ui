---
category: Estrutura
---

# Stat

O número de painel: rótulo, valor, variação e tendência, na hierarquia que todo
painel reinventa na mão.

O valor chega formatado porque formatar é decisão de domínio: dinheiro sai
abreviado do `currencyShort`, contagem sai crua, percentual traz o sinal.

`delta` é a variação, com `deltaLabel` dizendo contra o quê ("sobre julho").
Quando subir é ruim — vencidas, custo, inadimplência — passe
`invert`: a seta continua apontando para onde o número foi, o que inverte é o
julgamento da cor. A direção também é falada para leitor de tela, não só
pintada.

A tendência entra pelo slot `chart`, com a `Sparkline` de `@rivocode/ui/chart`:

```tsx
<Stat
  label="Faturado em agosto"
  value={currencyShort(246_700)}
  delta={20}
  deltaLabel="sobre julho"
  chart={<Sparkline data={TREND} variant="area" trend="auto" className="h-8 w-full" />}
/>
```

O núcleo não importa a `Sparkline` de propósito: ela traz o recharts junto, e
um painel sem gráfico não deveria pagar por ele.

## A variação nem sempre é porcentagem

O `%` era cravado no JSX, e o `Stat` era a única peça de número da casa fora do
vocabulário de formatação que `Progress`, `Meter` e `Slider` já falam. Um delta
em reais ou em pontos-base saía com um por-cento que não era verdade.

`deltaFormat` é o mesmo `format` das irmãs — nome de formatador da casa ou
função própria:

```tsx
<Stat label="Faturado" value={currencyShort(246_700)} delta={12_400}
      deltaFormat="currencyShort" deltaLabel="sobre julho" />
```

Sem ele, `percent`, que é o que sempre saiu. O `percent` da casa arredonda para
inteiro; para casa decimal, passe a função: `deltaFormat={(value) => percent(value, 1)}`.

O que chega ao formatador é o **módulo** do `delta`: quem carrega o sinal é a
seta, e o "alta de"/"queda de" que o leitor de tela ouve antes do número.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Stat` — `value` já formatado, `delta` numérico, e o slot `chart` que a `Sparkline` nativa preenche. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
