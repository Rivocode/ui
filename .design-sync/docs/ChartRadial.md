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

## O miolo é pequeno, e ele não cresce com o cartão

O arco é um quadrado limitado pelo menor lado, e a peça tem `11rem` (176px) de
altura fixa. Num cartão de 176px ou mais o vão de dentro trava em **cerca de
125px de largura**: alargar o cartão alarga o gráfico, e não o buraco.

O que cabe ali, medido nesse vão: **umas dez letras** no número grande
(`1,5rem`) e **umas dezoito** na linha de baixo (`0,75rem`) — `da meta do mês`
tem catorze e sobra espaço; `R$ 246,7K de R$ 300K` tem vinte e não cabe.
Passando do limite nada corta nem vira reticências, porque o teto que o CSS
impõe é uma fração da **largura do cartão**, e não o buraco: num cartão largo
a frase atravessa o anel de ponta a ponta, e num estreito ela quebra em duas
linhas e aperta contra a base aberta. Os dois saem feios, e nenhum dos dois acusa.

A hierarquia que funciona é a porcentagem como número grande e o denominador
como a linha de baixo, que é justamente o que a porcentagem não carrega:

```tsx
<ChartRadial value={246_700} max={300_000} centerLabel="de R$ 300K" />
```

Quando a frase é maior que isso, ela sai do miolo. O arco não tem legenda de
fora para receber texto — a rosca tem, e é uma das razões para escolhê-la —,
então o lugar é o cartão em volta: o título, ou uma linha de apoio acima do
gráfico. Para quem ouve, a frase inteira vai em `label`: sem ele o nome
acessível é só a porcentagem, e "82 por cento" sozinho não diz por cento de
quê.

## A legenda da rosca

`ChartDonut` tem lista embaixo com nome e valor de cada fatia, ligada por
padrão. O arco não tem: ele mostra uma medida só, e a legenda de um item é o
próprio rótulo.

Com `variant="segmented"` o arco vira tracinhos, que é a variação mais pedida
de medidor em painel. Os traços apagados continuam na tela de propósito: sem a
escala inteira visível, um traço aceso não significa nada.

## No React Native

Traduz quase inteiro, em `@rivocode/ui-native/chart`, e é a peça de gráfico que menos muda: **ela nunca teve dica**. O valor mora no meio do arco, em texto, desde o web. O que o dedo faria aqui, o olho já fez. `value`, `max`, `sweep`, `variant` e `segments` atravessam iguais, o arco em tracinhos incluído.

Duas mudanças de tipo, as mesmas da rosca: `centerValue` e `centerLabel` são `string`, e `color` é papel de token (`chart-3`, `success`) e não cor de CSS.

O papel de acessibilidade é `image`, como o `role="img"` do web, e os dois vizinhos explicam por quê: o `Meter` nativo já tinha recusado `progressbar`, que faz o leitor de tela anunciar indicador de progresso para uma medida que sobe e desce, e `adjustable`, que prometeria que o gesto muda o valor. O nome carrega o número, então ouvir a peça é ouvir a medida. Sem `label`, ele é montado do que está escrito no meio (o valor **e** a linha de baixo), e não só a porcentagem como no web: "82 por cento" sozinho não diz por cento de quê.
