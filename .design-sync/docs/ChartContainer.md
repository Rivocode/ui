---
category: Grafico
---

# ChartContainer

A moldura de todo grafico, sobre a Recharts. Vive em `@rivocode/ui/chart`.

Ela publica uma variavel de CSS por serie, com o nome da serie: `emitidas` no
`config` vira `var(--color-emitidas)`, entao a linha, a barra e a dica falam do
mesmo jeito e trocar a cor e mexer num lugar so. Sem cor declarada, entra a
proxima da paleta de oito na ordem do `config`.

A Recharts nao le classe do Tailwind e nao conhece os nossos tokens, entao a
ponte tem que ser por variavel. Escrever a cor direta no `stroke` funciona ate
o tema mudar.

A altura fica com quem usa, por classe: grafico sem altura definida some,
porque o contentor mede o pai.

As pecas da Recharts que a biblioteca veste saem pelo mesmo import:
`LineChart`, `Line`, `BarChart`, `Bar`, `AreaChart`, `Area`, `PieChart`, `Pie`,
`Cell`, `XAxis`, `YAxis`, `CartesianGrid` e `ReferenceLine`.
