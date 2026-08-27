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
porque o contentor mede o pai. Onde a moldura mede largura e nenhuma altura, ela
avisa no console em desenvolvimento em vez de entregar um cartão vazio. O aviso
espera o layout assentar antes de acusar, porque a caixa mede zero por um quadro
no caminho normal.

## Os quatro finais de uma consulta

Os mesmos do `DataTable`, e o `empty` é o mesmo objeto: `title`, `description`,
`action` e `icon`. A ação é fortemente recomendada: um gráfico que só diz
"sem dados" empurra para a pessoa o trabalho de adivinhar o que fazer.

```tsx
<ChartContainer
  config={config}
  className="h-64"
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  empty={{
    title: 'Nenhuma nota em março',
    description: 'O gráfico começa a desenhar assim que a primeira for emitida.',
    action: <Button size="sm">Emitir nota</Button>,
  }}
>
  <LineChart data={meses}>{/* ... */}</LineChart>
</ChartContainer>
```

**O erro diz o que falhou.** `errorTitle` e `errorMessage` são o par: num
painel de quatro gráficos, "Não foi possível carregar o gráfico" quatro vezes
não diz qual deles caiu, e num produto que não fala português não diz nada.
Sem eles, o texto padrão continua o de sempre. Os dois nomes são os mesmos do
`DataTable`, de propósito, e atravessam para o React Native com os mesmos
padrões. Só o tipo estreita para `string`, porque o título do `Alert` nativo é
um `Text`.

**O botão de nova tentativa também se traduz.** `retryLabel` (padrão "Tentar de
novo") nomeia o botão que executa o `onRetry`, com o mesmo nome e o mesmo padrão
nas quatro peças de consulta. Sem ele, o painel em inglês saía com o título
traduzido e o botão em português.

**A espera se anuncia em voz alta.** `aria-busy` num nó sem papel não é lido por
leitor de tela nenhum: ele descreve o estado de uma região, e só chega a quem já
está dentro dela. Quem esperava ouvia silêncio, e a chegada do dado, que troca a
tela inteira, também não dizia nada. As quatro irmãs publicam a mesma região viva
(`role="status" aria-live="polite"`, marcada com `data-rc-status`), que diz
"Carregando…" enquanto a consulta não volta e "Conteúdo carregado" quando ela
volta. Ela existe antes de o texto mudar e é o mesmo nó do primeiro ao último
estado: região que nasce já com o texto dentro não dispara anúncio nenhum.

A moldura já tinha uma região viva antes desta, e as duas convivem: a do ponto
ativo, que copia a dica quando a Recharts anda de ponto em ponto pelo teclado, e
a da espera. `data-rc-status` e `data-rc-active-point` separam uma da outra.

**A contagem de pontos sai do próprio gráfico.** A moldura lê o `data` do filho
da Recharts, então na forma acima não é preciso repeti-lo. Passe `data` aqui só
quando os pontos não morarem no filho direto (`<ScatterChart>` com o `data` no
`<Scatter>`) ou quando a série desenhada não for a que decide o vazio.

Antes disso o vazio exigia `empty` **e** `data`, e quem passava só o primeiro
nunca via o estado que tinha pedido: o gráfico desenhava eixos sobre o nada, sem
erro nenhum. Onde a moldura ainda não acha ponto para contar, ela avisa no
console em desenvolvimento em vez de calar.

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
movimento" do sistema. O resto do catálogo resolve isso por token (o
`--rc-duration-*` vai a zero e toda transição para), mas a Recharts não anima
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

## Os eixos

`ChartXAxis` e `ChartYAxis` embrulham os da Recharts com a cor, a fonte e o
respiro do tema, e com o `format` da casa: `format="dayMonth"` no eixo do tempo,
`format="currencyShort"` no de valor. Sem eles, cada tela escreve o próprio
`tickFormatter` e um eixo lê diferente do outro: R$ 12.400 aqui, 12400 ali,
12,4k na terceira.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/chart`, com o mesmo arranjo do formulário e pela mesma razão: o `react-native-svg` é peer **opcional**, e no celular ele não é só bytes, é módulo nativo que o app precisa ligar e reconstruir.

**O que atravessa inteiro são os quatro finais.** `isLoading`, `isError`, `onRetry`, `errorTitle`, `errorMessage`, `retryLabel`, `empty` e `data` têm os mesmos nomes e o mesmo sentido, e a espera desenha as mesmas seis barras desiguais. Três diferenças de tipo, todas porque texto no nativo mora dentro de um `Text`: `errorMessage`, `empty.title` e `empty.description` são `string`, e `empty.icon` não existe, porque o `EmptyState` nativo ainda não tem esse slot. O botão de tentar de novo fica **fora** do aviso: o `Alert` nativo tem título e corpo, e o corpo é uma linha de texto.

**O que muda é o desenho.** No web a moldura embrulha um gráfico da Recharts, que mede o pai sozinho e lê a cor de cada série em `var(--color-série)`. Aqui não há Recharts, não há contentor que meça e não há variável viva. Então a moldura mede com `onLayout`, resolve as cores do `config` e **entrega as duas coisas** a quem desenha, como o `Form` nativo entrega o `submit`:

```tsx
<ChartContainer config={SERIES} data={meses} className="h-56">
  {({ width, height, colors }) => (
    <Svg width={width} height={height}>…</Svg>
  )}
</ChartContainer>
```

O `colors` do quadro é um **mapa pela chave do `config`**, e não um array: é o `var(--color-série)` do web com outro veículo, e quem desenha pede a cor de `receita` pelo nome, que é o que sobrevive a alguém reordenar o `config`. O array é o `PALETTE`, e ele é array dos dois lados: é a ordem de sobra, de onde sai a cor de quem não declarou `color`. A diferença é que aqui ele é **exportado**, porque sem variável viva quem desenha à mão precisa alcançá-lo.

A medida chega **zerada no primeiro quadro** e verdadeira no seguinte: no telefone não existe largura antes do layout. O `children` também aceita JSX comum, e é assim que `ChartDonut` e `ChartRadial` ganham os quatro finais sem precisar de nada da moldura.

Duas regras a mais, as duas por causa do que não existe do lado de cá. O `config.color` pede **papel de token** (`chart-1` a `chart-8`), e não cor de CSS: a cor que a peça recebe é o valor final que vai para o desenho, e um hexadecimal escrito ali seria a única coisa da tela surda ao tema do cliente. E o `label` só vale na forma de função: com filho em JSX quem nomeia é a peça de dentro, e um `accessible` por cima dela fecharia a legenda da rosca numa parada só do leitor de tela.
