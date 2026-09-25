---
category: Gráfico
---

# ChartGauge

Um medidor de 0 a `max` com faixas que dizem se o número está bom: em dia,
atenção, crítico. O valor fica escrito no meio, e o nome da faixa embaixo dele.

```tsx
<ChartGauge
  value={8.4}
  max={20}
  centerValue="8,4%"
  bands={[
    { until: 5, tone: 'success', label: 'Em dia' },
    { until: 12, tone: 'warning', label: 'Atenção' },
    { until: 20, tone: 'danger', label: 'Crítico' },
  ]}
/>
```

Cada faixa vai de onde a anterior parou até o seu `until`, e o limite é
inclusivo: em `5`, ainda está em dia. O anel fino de fora desenha as faixas, o
arco grosso de dentro vai de zero até o valor na cor da faixa em que ele caiu, e
um ponteiro marca o lugar exato sobre o anel. Sem `bands`, o medidor é um arco
neutro de acento, sem ponteiro.

## Fora da escala

O número escrito é sempre o real. Com `value={140}` e `max={100}`, o meio diz
"140" e o leitor de tela ouve "140 de 100, Crítico": só o arco, o ponteiro e a
faixa param na ponta, porque o desenho não tem para onde ir, mas a pessoa
precisa saber o quanto passou. Abaixo de zero vale o mesmo, na outra ponta. Um
`NaN` ou um infinito não é número nenhum: o meio mostra "—", sem faixa, sem
ponteiro e sem arco pintado.

Com `centerValue`, o nome acessível diz o mesmo texto que está na tela ("R$
1.234.567,89 de 2.000.000"), e não o número cru. O texto do meio tem a largura
do furo do arco, e a fonte encolhe até caber: um valor comprido fica menor, e
nunca cobre o arco nem sai do cartão.

O `sweep` vai de 0 a 360, e 360 fecha o anel.

## A cor nunca está sozinha

O nome da faixa sai escrito embaixo do número (troque por `centerLabel` se
quiser outra frase), e é ele que o leitor de tela ouve junto com o valor: "8,4
de 20, Atenção". A régua das faixas inteira vai na descrição, para quem quer
saber onde começa o crítico sem ver o anel.

As faixas pintam os papéis `success-text`, `warning-text` e `danger-text`, e não
`success`, `warning` e `danger`. A diferença é medida: o arco é desenhado por
cima do trilho, e o `danger` do tema escuro sobre o trilho dava 2,99:1, abaixo
dos 3:1 que a norma pede para um objeto que precisa ser percebido. A faixa
crítica, justamente, era a única que sumia.

## Contra o Meter e o ChartRadial

As três mostram uma medida só, e a escolha é pela pergunta:

- **`Meter`** é uma barra que cabe numa linha de formulário ou de tabela, e não
  julga o número: diz quanto, e quem lê decide se é muito.
- **`ChartRadial`** é o arco de uma medida que tem **meta**: quanto falta para
  chegar. Não tem faixas, e subir é sempre melhor.
- **`ChartGauge`** é o medidor que **julga**: o número cai numa faixa com nome,
  e a faixa pode dizer que subir é pior (inadimplência, uso de cota, tempo de
  resposta). É a única das três em que a mesma cor pode ser boa num cartão e
  ruim no vizinho, porque quem decide é a faixa, e não a direção.

## Movimento

Na primeira vez que aparece, o arco e o ponteiro saem do zero até o valor, em
`--rc-duration-slow` com a curva `--rc-ease`; quando o valor muda, andam do
velho ao novo. Com "reduzir movimento", nascem no lugar.

## Quando não usar

Sem faixa que diga bom ou ruim, é o `ChartRadial`, que ocupa o mesmo cartão e
não finge um julgamento que ninguém fez. Numa linha de formulário, é o `Meter`.
E para mostrar como o número andou no mês, nenhum dos três: é `Sparkline` ou
`LineChart`, porque o medidor só sabe o agora.

## No React Native

Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `value`, `max`, `bands`, `sweep`, `centerValue`, `centerLabel`, `label`. As faixas são as mesmas, com `tone` `success`, `warning` ou `danger`, e pintam os mesmos papéis `-text` do web: a medida do arco sobre o trilho é a mesma nos dois lados, e está no mapa de contraste do nativo.

Duas mudanças de tipo, as da rosca e do arco: `centerValue` e `centerLabel` são `string`, e `format` só aceita função. E uma de leitura: no web a régua das faixas vai numa descrição separada, ligada por `aria-describedby`; o celular não tem esse canal, então ela entra no fim do nome acessível ("72 de 100, Atenção. Bom de 0 a 60; Atenção de 60 a 85; Crítico de 85 a 100"). O papel é `image`, pela mesma razão do `ChartRadial`.

O arco e o ponteiro andam juntos até o valor novo, pelo Reanimated, e nascem no lugar com "reduzir movimento".
