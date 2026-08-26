---
category: Gráfico
---

# ChartRadial

O arco de uma medida só: meta batida, uso de cota, taxa de conversão.

```tsx
<ChartRadial value={82} centerLabel="da meta do mês" />
```

## Contra o Meter

Escolha pelo espaço, não pelo gosto. A barra do `Meter` cabe numa linha de
formulário e lê mais rápido. O arco pede um cartão inteiro, e ganha quando o
número **é o assunto** do cartão, não um detalhe dentro dele.

## Não é Progress

O progresso anda para o fim e termina; esta medida sobe e desce enquanto o mês
corre. Por isso ela sai como `role="img"` com rótulo, e não como barra de
carregamento, trocar um pelo outro faz o leitor de tela anunciar "carregando"
para algo que não carrega.

## O eixo escondido

`sweep` é quanto do círculo o arco ocupa. Em `270`, que é o padrão, ele deixa a
base aberta, e é ali que o rótulo de baixo respira. Em `360` fecha.

Por dentro há um `PolarAngleAxis` com `domain={[0, max]}` que não desenha nada.
Ele existe porque a Recharts normaliza pelo maior valor da série, e com um único
ponto isso significa que **qualquer valor daria a volta inteira**.

## O miolo é pequeno

O buraco de um arco cabe uma palavra curta. `R$ 246.700,00` quebra em duas
linhas ali dentro e fica apertado.

A hierarquia que funciona é a porcentagem como número grande, e o valor por
extenso como a linha de baixo:

```tsx
<ChartRadial value={246_700} max={300_000} centerLabel="R$ 246,7K de R$ 300K" />
```

## A legenda da rosca

`ChartDonut` tem lista embaixo com nome e valor de cada fatia, ligada por
padrão. O arco não tem: ele mostra uma medida só, e a legenda de um item é o
próprio rótulo.

Com `variant="segmented"` o arco vira tracinhos, que é a variação mais pedida
de medidor em painel. Os traços apagados continuam na tela de propósito: sem a
escala inteira visível, um traço aceso não significa nada.

## No React Native

Traduz quase inteiro, em `@rivocode/ui-native/chart`, e é a peça de gráfico que menos muda: **ela nunca teve dica**. O valor mora no meio do arco, em texto, desde o web — o que o dedo faria aqui, o olho já fez. `value`, `max`, `sweep`, `variant` e `segments` atravessam iguais, o arco em tracinhos incluído.

Duas mudanças de tipo, as mesmas da rosca: `centerValue` e `centerLabel` são `string`, e `color` é papel de token (`chart-3`, `success`) e não cor de CSS.

O papel de acessibilidade é `image`, como o `role="img"` do web, e os dois vizinhos explicam por quê: o `Meter` nativo já tinha recusado `progressbar`, que faz o leitor de tela anunciar indicador de progresso para uma medida que sobe e desce, e `adjustable`, que prometeria que o gesto muda o valor. O nome carrega o número, então ouvir a peça é ouvir a medida. Sem `label`, ele é montado do que está escrito no meio — o valor **e** a linha de baixo, e não só a porcentagem como no web: "82 por cento" sozinho não diz por cento de quê.
