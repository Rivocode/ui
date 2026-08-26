# Gráficos: `@rivocode/ui/chart`

Não vem no pacote principal. É dependência opcional, e chega pelo mesmo
provider. Instale junto: `recharts`.

Recharts vestida pelo tema. A cor de cada série vem do `config` e vira variável
com o nome da série. **A altura é sua, por classe: gráfico sem altura some.**

```tsx
import {
  Area, AreaChart, CartesianGrid, ChartContainer, ChartTooltip,
  ChartTooltipContent, ChartXAxis, ChartYAxis, type ChartConfig,
} from '@rivocode/ui/chart'

const config: ChartConfig = { billed: { label: 'Faturado' } }

<ChartContainer config={config} className="h-72">
  <AreaChart data={months}>
    <CartesianGrid vertical={false} />
    <ChartXAxis dataKey="month" />
    <ChartYAxis format="currencyShort" />
    <ChartTooltip content={<ChartTooltipContent config={config} />} />
    <Area dataKey="billed" stroke="var(--color-billed)" fill="var(--color-billed)" />
  </AreaChart>
</ChartContainer>
```

`ChartXAxis` e `ChartYAxis` já vêm sem a linha grossa e sem o tracinho de 2015.
O `format` aceita `currency`, `currencyShort`, `compact`, `integer`, `percent`,
`monthShort`, `dayMonth`, ou uma função sua. Os nove estão reunidos em
`formatters`, e **saem também pela raiz** `@rivocode/ui`: formatar dinheiro numa
célula de tabela não é assunto de gráfico, e importar do subcaminho do gráfico
para escrever um `Stat` traz a recharts junto sem necessidade.

`compact` abrevia com símbolo, `12,4K`, `1,2M`, que é a convenção de painel e
cabe em menos pixel, e num eixo largura é espaço tirado do gráfico.
`compactWords` e `currencyShortWords` escrevem `12,4 mil`, que lê melhor em
texto corrido. **Não misture as duas na mesma tela.**

**Dinheiro sai abreviado.** `currencyShort` em indicador, tabela, eixo, legenda
e dica. O `currency`, por extenso, fica para onde o centavo é o assunto: o valor
que a pessoa confirma antes de emitir, e o comprovante depois.

| Peça | Para que |
|---|---|
| `ChartAreaGradient` + `areaGradient(id, série)` | Gradiente de área. **O `id` é seu, e precisa ser único na página** |
| `ChartDonut` | Rosca com o total no buraco e a lista de fatias embaixo |
| `ChartRadial` | O arco de uma medida só: meta, cota, conversão |
| `Sparkline` | A linha miúda que cabe dentro de um indicador |
| `ChartLegend` + `ChartLegendContent` | A legenda, com o nome que está no `config` |
| `useSeriesToggle` | A legenda vira filtro: clicar esconde a série |
| `useChartMotion` | Respeita "reduzir movimento", que nenhum token alcança aqui |

Também saem daqui radar, dispersão, polar e `LabelList`. O `Tooltip` e o
`Legend` da Recharts **não**: os nossos já embrulham os dois.

A recharts não anima por CSS, ela interpola em JS, então `--rc-duration-*` indo
a zero não a alcança: numa tela com "reduzir movimento" ligado o único
movimento que sobra é justamente o maior deles. Espalhe o `useChartMotion()` na
marca:

```tsx
const motion = useChartMotion()

<Line dataKey="paid" stroke="var(--color-paid)" {...motion} />
```

`areaGradient` é função pura de propósito. A primeira versão tirava o `id` de um
contexto, e o `fill` de `<Area>` é avaliado no render de fora, onde esse contexto
ainda não existe, quem escrevia o óbvio levava erro em tempo de execução.
