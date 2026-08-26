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

Ainda não portado — depende de um gráfico nativo que ainda não existe. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
