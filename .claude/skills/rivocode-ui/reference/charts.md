# Gráficos: `@rivocode/ui/chart`

Não vem no pacote principal. É dependência opcional, e chega pelo mesmo
provider. Instale junto: `recharts`.

Recharts vestida pelo tema. A cor de cada série vem do `config` e vira variável
com o nome da série. **A altura é sua, por classe: gráfico sem altura some** - e a
moldura acusa isso no console em desenvolvimento, quando mede largura e nenhuma
altura.

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
| `ChartGauge` | Medidor de 0 a `max` com faixas (`bands`) que julgam o número: em dia, atenção, crítico |
| `ChartHeatmap` | Grade de linha por coluna em que a cor diz o tamanho: emissões por dia e hora |
| `ChartFunnel` | As etapas de um caminho, com a taxa de conversão escrita entre elas |
| `ChartTreemap` | Área proporcional por categoria, com o rótulo que some quando não cabe |
| `Sparkline` | A linha miúda que cabe dentro de um indicador |
| `ChartLegend` + `ChartLegendContent` | A legenda, com o nome que está no `config` |
| `useSeriesToggle` | A legenda vira filtro: clicar esconde a série |
| `useChartMotion` | Duração e curva dos tokens, e "reduzir movimento", para marca fora da moldura |

Também saem daqui radar, dispersão, polar e `LabelList`. O `Tooltip` e o
`Legend` da Recharts **não**: os nossos já embrulham os dois.

A Recharts não anima por CSS, ela interpola em JS, e nenhum token a alcança
sozinho. **O `ChartContainer` resolve isso por você**: toda marca dentro dele sai
com a duração de `--rc-duration-slow`, a curva de `--rc-ease`, e a animação
ligada antes de a marca montar, e desligada com "reduzir movimento". **Na
primeira vez que aparece com dados, o gráfico se desenha**: a barra cresce da
base, a linha e a área se revelam, e quando o dado muda cada marca anda do valor
velho ao novo. Sair do esqueleto, do erro ou do vazio para os dados também
entra desenhando. Não escreva `isAnimationActive` nem `animationDuration` na
marca. `isAnimationActive={false}` escrito à mão continua valendo, para a marca
que tem de ficar parada.

No servidor o gráfico não desenha: a Recharts só pinta depois de medir a
caixa, então o HTML do SSR sai com a moldura, e o desenho nasce no cliente, já
entrando. Não há o que piscar, porque não havia desenho antes.

Fora da moldura, espalhe o `useChartMotion()`, que devolve o mesmo trio:

```tsx
const motion = useChartMotion()

<Line dataKey="paid" stroke="var(--color-paid)" {...motion} />
```

`ChartDonut` e `ChartRadial` entram varrendo do zero e andam até o valor novo
sozinhas. A `Sparkline` entra só esmaecendo, em `--rc-duration-base`, e não anda
na troca de dados: numa tabela ela aparece às dezenas, e vinte linhas se
desenhando ao mesmo tempo são uma onda atravessando a tela.

`areaGradient` é função pura de propósito. A primeira versão tirava o `id` de um
contexto, e o `fill` de `<Area>` é avaliado no render de fora, onde esse contexto
ainda não existe, quem escrevia o óbvio levava erro em tempo de execução.

## Heatmap, medidor, funil e treemap

Os quatro são desenho próprio, sem Recharts, e **não entram no
`ChartContainer`**: carregando, erro e vazio vêm do `QueryBoundary` em volta.

```tsx
import { ChartFunnel, ChartGauge, ChartHeatmap, ChartTreemap } from '@rivocode/ui/chart'

<ChartHeatmap data={emissoes} rowKey="dia" columnKey="hora" valueKey="total" label="Notas por dia e hora" />
<ChartGauge value={8.4} max={20} bands={[{ until: 5, tone: 'success', label: 'Em dia' }, { until: 20, tone: 'danger', label: 'Crítico' }]} />
<ChartFunnel data={adesao} valueKey="total" nameKey="etapa" label="Funil de adesão" />
<ChartTreemap data={porServico} valueKey="total" nameKey="codigo" label="Faturamento por serviço" className="h-72" />
```

- **`ChartHeatmap`**: o `data` é longo, uma linha por célula. Combinação que
  não vem é **célula vazia** (borda tracejada), e `0` é valor (primeiro degrau):
  não troque um pelo outro. `rows` e `columns` dão a ordem e trazem a linha sem
  registro. `domain` fixa a régua quando duas grades se comparam. `label` é
  obrigatório: vira a legenda da tabela escondida que o leitor de tela lê.
- **`ChartGauge`** julga, o `ChartRadial` mede contra meta, o `Meter` só diz
  quanto. Use o medidor quando a faixa tem nome e subir pode ser pior.
- **`ChartFunnel`**: etapas que são subconjunto uma da outra. Sem isso não há
  conversão, e é barra deitada.
- **`ChartTreemap`**: acima de seis categorias, onde a rosca para de informar. A
  altura é sua, por classe (padrão `h-64`).
