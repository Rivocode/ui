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
