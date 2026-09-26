---
category: Gráfico
---

# ChartDonut

Rosca com o total no meio.

```tsx
<ChartDonut
  data={porNatureza}
  valueKey="total"
  nameKey="natureza"
  centerValue={compact(246700)}
  centerLabel="no mês"
/>
```

A pizza responde "qual é a maior fatia" e nada mais. A rosca responde a mesma
coisa e ainda usa o buraco para dizer o total, que é o número que a pessoa veio
buscar. Um painel que mostra a divisão sem mostrar o total obriga a somar de
cabeça.

## O anel

`thickness` é a espessura, em fração do raio: quanto mais fino o anel, maior o
buraco, e é ali que o total precisa caber. Em `1` ela fecha e vira pizza.

O número do meio fica preso à largura do buraco. Total comprido escapando por
cima do anel é o defeito clássico dessa peça.

**O miolo fica sempre à vista, e a dica abre fora do buraco.** Ela não segue o
ponteiro: vai para o lado da rosca quando a largura sobra (à direita, e à
esquerda se só ali couber) e para cima do anel quando não sobra, como num
cartão de celular. Assim a dica diz o número da fatia, o miolo continua dizendo
o total, e um nunca cobre o outro. Medido no Chrome a 390px e a 900px: o
retângulo da dica não cruza o do miolo, e o miolo segue com opacidade 1 durante
a leitura.

Até aqui o miolo apagava enquanto o ponteiro lia uma fatia, porque a dica da
Recharts caía em cima dele; o total sumia justo quando a pessoa comparava.

O anel não é parada de tabulação. Com legenda, quem lê a rosca pelo leitor de
tela lê a lista da legenda, e o desenho fica escondido; sem legenda, o desenho
vira uma imagem só, com nome. Nos dois casos o teclado passa direto pelo anel,
em vez de parar num grupo que o leitor não anuncia.

## Movimento

Na primeira vez que aparece, a rosca varre do zero: as fatias saem juntas do
topo e cada uma se abre até o seu ângulo. Quando os dados mudam, cada fatia anda
do ângulo velho ao novo. Nos dois casos, com a duração e a curva dos tokens
(`--rc-duration-slow`, `--rc-ease`), pela mesma decisão do `ChartContainer`.
Com "reduzir movimento", a rosca nasce pronta e a troca é seca.

## As cores

Sem `config`, cada fatia pega uma cor da paleta do tema, na ordem. Com `config`,
vale a `color` que você escreveu ali; e a fatia declarada sem `color` pega a da
paleta **na ordem do `config`**, e não na ordem em que ela chega no `data`. É o
que deixa a cor de "Serviço" parada quando a consulta devolve as naturezas em
outra ordem no mês seguinte. Fatia que o `config` não conhece vem depois das
declaradas, na ordem do `data`.

O que não funciona é `var(--color-<nome>)`: essas variáveis são escritas pelo
`ChartContainer`, e a rosca desenha sozinha, fora dele.

## Sem dado

`empty` é o mesmo objeto do `ChartContainer` e do `DataTable`: `title`,
`description` obrigatória, `action` e `icon` opcionais. Ele aparece no lugar do
desenho quando a lista vem vazia ou todas as fatias somam zero. Sem ele, a rosca desenha só o **anel de fundo**, na cor da borda do tema, com o miolo por cima: o total zero continua dito, e o cartão não fica com um buraco branco no lugar do gráfico.

O anel de fundo existe sempre, também com dado: é ele que aparece nas frestas
entre as fatias.

## Quando não usar

Acima de seis fatias ela para de informar: as menores viram tiras finas e a
legenda vira uma lista que a pessoa lê em vez de olhar. Nesse caso, barra
deitada lê melhor, e ainda cabe o rótulo por extenso.

## No React Native

Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `valueKey`, `nameKey`, `config`, `thickness`, `legend`, `centerValue`, `centerLabel` e `format`, que aceita o nome de um formatador da casa (`currencyShort`, `percent`) ou uma função, como no web. Uma mudança de tipo: o miolo é `string` e não `ReactNode`.

**O que muda de verdade é como se lê uma fatia.** No web o ponteiro pousa no anel e a dica, aberta fora do buraco, diz nome e valor, com o total parado no meio. No toque não existe pousar, e o gesto equivalente mora na **legenda**, não na fatia: tocar a linha acende a fatia dela e manda nome e valor para o meio, no lugar do total; tocar de novo devolve o total.

A fatia não é o alvo, e a razão é aritmética: um anel de 190px tem cerca de 600px de contorno para dividir entre até seis fatias, e a de 2% fica com doze (a mesma conta que tirou a dica por quadrado do `Tracker`). A linha da legenda tem 44px e a largura da tela.

**E a leitura de tela não usa o truque do `Tracker`.** Lá os 90 períodos viraram uma parada `adjustable` só, porque 90 paradas dentro de um cartão são um obstáculo. Aqui são no máximo seis fatias (acima disso a rosca para de informar e barra deitada lê melhor), e seis paradas com nome e valor são melhores que uma ajustável, porque cada uma é também o botão que acende a fatia. Contagem diferente, saída diferente. Com `legend={false}` o desenho vira imagem cujo nome carrega as fatias **e os valores**: sem legenda e sem dica, o dado ficaria inalcançável.

Uma diferença de desenho, e ela é medida: as pontas das fatias saem **retas**. O `cornerRadius` do web vem da Recharts, que recorta o canto de uma fatia preenchida; aqui a fatia é um arco traçado, e a ponta redonda que o SVG oferece estende o traço em quase doze graus para cada lado na espessura padrão: uma fatia de 5% apareceria como 11%.

O movimento é o do web: a rosca nasce pronta e, quando os dados mudam, cada fatia anda do ângulo velho ao novo com a duração e a curva dos tokens, pelo Reanimated. Com "reduzir movimento", a troca é seca.
