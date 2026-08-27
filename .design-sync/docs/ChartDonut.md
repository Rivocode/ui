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

## As cores

Sem `config`, cada fatia pega uma cor da paleta do tema, na ordem. Com `config`,
vale a `color` que você escreveu ali.

O que não funciona é `var(--color-<nome>)`: essas variáveis são escritas pelo
`ChartContainer`, e a rosca desenha sozinha, fora dele.

## Quando não usar

Acima de seis fatias ela para de informar: as menores viram tiras finas e a
legenda vira uma lista que a pessoa lê em vez de olhar. Nesse caso, barra
deitada lê melhor, e ainda cabe o rótulo por extenso.

## No React Native

Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `valueKey`, `nameKey`, `config`, `thickness`, `legend`, `centerValue`, `centerLabel`. Duas mudanças de tipo: o miolo é `string` e não `ReactNode`, e o `format` só aceita função, que é a decisão que o `Meter` nativo já tinha tomado. Resolver nome de formatador arrasta o `Intl` inteiro para o bundle do celular.

**O que muda de verdade é como se lê uma fatia.** No web o ponteiro pousa no anel, a dica diz nome e valor, e o total sai de cena para os dois números não se empilharem. No toque não existe pousar, e o gesto equivalente mora na **legenda**, não na fatia: tocar a linha acende a fatia dela e manda nome e valor para o meio, no lugar exato onde o web põe a dica; tocar de novo devolve o total.

A fatia não é o alvo, e a razão é aritmética: um anel de 190px tem cerca de 600px de contorno para dividir entre até seis fatias, e a de 2% fica com doze (a mesma conta que tirou a dica por quadrado do `Tracker`). A linha da legenda tem 44px e a largura da tela.

**E a leitura de tela não usa o truque do `Tracker`.** Lá os 90 períodos viraram uma parada `adjustable` só, porque 90 paradas dentro de um cartão são um obstáculo. Aqui são no máximo seis fatias (acima disso a rosca para de informar e barra deitada lê melhor), e seis paradas com nome e valor são melhores que uma ajustável, porque cada uma é também o botão que acende a fatia. Contagem diferente, saída diferente. Com `legend={false}` o desenho vira imagem cujo nome carrega as fatias **e os valores**: sem legenda e sem dica, o dado ficaria inalcançável.

Uma diferença de desenho, e ela é medida: as pontas das fatias saem **retas**. O `cornerRadius` do web vem da Recharts, que recorta o canto de uma fatia preenchida; aqui a fatia é um arco traçado, e a ponta redonda que o SVG oferece estende o traço em quase doze graus para cada lado na espessura padrão: uma fatia de 5% apareceria como 11%.
