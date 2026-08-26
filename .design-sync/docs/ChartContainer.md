---
category: Gráfico
---

# ChartContainer

A moldura de todo gráfico, sobre a Recharts. Vive em `@rivocode/ui/chart`.

Ela publica uma variável de CSS por serie, com o nome da serie: `emitidas` no
`config` vira `var(--color-emitidas)`, então a linha, a barra e a dica falam do
mesmo jeito e trocar a cor e mexer num lugar só. Sem cor declarada, entra a
proxima da paleta de oito na ordem do `config`.

A Recharts não le classe do Tailwind e não conhece os nossos tokens, então a
ponte tem que ser por variável. Escrever a cor direta no `stroke` funciona até
o tema mudar.

A altura fica com quem usa, por classe: gráfico sem altura definida some,
porque o contentor mede o pai.

As peças da Recharts que a biblioteca veste saem pelo mesmo import:
`LineChart`, `Line`, `BarChart`, `Bar`, `AreaChart`, `Area`, `PieChart`, `Pie`,
`Cell`, `XAxis`, `YAxis`, `CartesianGrid` e `ReferenceLine`.

## Gradiente de área

Área chapada compete com a linha que a delimita: a cor cheia embaixo pesa tanto
quanto o traço em cima, e num gráfico de duas séries a de trás some atrás da da
frente.

```tsx
function Faturamento() {
  const faturado = useAreaGradient('faturado')

  return (
    <ChartContainer config={config} className="h-64">
      <AreaChart data={meses}>
        <ChartAreaGradient series={['faturado']} />
        <Area dataKey="faturado" stroke="var(--color-faturado)" fill={faturado} />
      </AreaChart>
    </ChartContainer>
  )
}
```

O `id` do gradiente sai do `id` deste gráfico. Sem isso, dois gráficos na mesma
página com o mesmo nome de série pintariam um com o gradiente do outro, porque
`id` de SVG é global no documento.

## Movimento

```tsx
const motion = useChartMotion()

<Line dataKey="pagas" stroke="var(--color-pagas)" {...motion} />
```

`useChartMotion()` liga a animação da Recharts à preferência de "reduzir
movimento" do sistema. O resto do catálogo resolve isso por token — o
`--rc-duration-*` vai a zero e toda transição para —, mas a Recharts não anima
por CSS, ela interpola em JavaScript, e nenhum token a alcança. Sem isto, o
único movimento que sobra numa tela com movimento reduzido é justamente o maior
deles.

## As peças da Recharts que saem daqui

`Area`, `AreaChart`, `Bar`, `BarChart`, `Line`, `LineChart`, `Pie`, `PieChart`,
`Cell`, `Scatter`, `ScatterChart`, `Radar`, `RadarChart`, `RadialBar`,
`RadialBarChart`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`,
`CartesianGrid`, `XAxis`, `YAxis`, `ZAxis`, `LabelList`, `Rectangle`,
`ReferenceLine` e `ReferenceArea`.

A lista é curada, e não um `export *`. O `Tooltip` e o `Legend` da Recharts
**não** saem por aqui: os nossos já embrulham os dois, e o nome colidiria com o
`Tooltip` do catálogo.
