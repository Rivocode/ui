---
category: Gráfico
---

# ChartFunnel

As etapas de um caminho, com quantos chegaram a cada uma e quantos passaram de
uma para a seguinte: de quem visitou a quem emitiu a primeira nota.

```tsx
<ChartFunnel
  data={adesao}
  valueKey="total"
  nameKey="etapa"
  format="integer"
  label="Funil de adesão em agosto"
/>
```

Cada etapa tem o nome, o número e uma barra com largura proporcional à etapa
mais larga. Entre duas etapas vem a **taxa de conversão**, escrita: "↓ 25%
da etapa anterior". No fim, a conversão de ponta a ponta. A taxa é a informação
que o desenho de funil sozinho não dá, porque o olho compara largura e não
razão, e é quase sempre a pergunta de quem abriu o painel.

## A conta

A taxa é a etapa sobre a anterior, e a de ponta a ponta é a última sobre a
primeira. Etapa anterior zerada não inventa taxa: aparece "—". `formatRate`
troca a escrita, e recebe de 0 a 100. `labels.rate` e `labels.overall` trocam
as frases, que é o que um produto em outra língua precisa; `showOverall={false}`
esconde a linha do total.

## O desenho

`align="center"` desenha o funil de verdade, cada barra centrada sob a de cima.
`align="start"` alinha as barras à esquerda, que lê melhor quando os nomes são
longos e o que importa é comparar comprimento.

Todas as barras têm a mesma cor, `var(--rc-chart-1)` ou a do `color`, e isso é
de propósito: as etapas não são categorias diferentes, são a mesma população
encolhendo, e uma cor por etapa sugeriria o contrário.

## Leitor de tela

Não há desenho para descrever: a peça **é** uma lista ordenada, com o nome de
cada etapa, o número e a taxa em texto, e a barra fica escondida dele. `label`
dá nome à lista.

## Movimento

As barras crescem do centro (ou da esquerda, no `start`) na primeira vez, e
andam até a largura nova quando os dados mudam, em `--rc-duration-slow`. Com
"reduzir movimento", nascem no lugar.

## Sem dado

`empty` é o mesmo objeto do `ChartContainer` e do `DataTable`: `title`,
`description` obrigatória, `action` e `icon` opcionais. Ele aparece no lugar do
desenho quando a lista vem vazia ou todas as etapas somam zero. Sem ele, o funil desenha as etapas com barra de largura zero.


Quando as etapas não são um subconjunto uma da outra (canais de aquisição,
naturezas de nota), não há conversão para calcular, e o que existe é
comparação: barra deitada. Quando o assunto é **onde a pessoa está** num
processo, e não quantas passaram, é o `Steps`, que olha para a frente. E para
dizer que parte do total é de cada coisa, é o `ChartDonut`: fatia é parte de um
todo, e etapa de funil não é.

## No React Native

Traduz, em `@rivocode/ui-native/chart`, e é a peça de gráfico que menos precisa do `react-native-svg`: as barras são `View`, e a conta das taxas é a mesma função do web, gerada em `native/src/shared/`. `valueKey`, `nameKey`, `align`, `formatRate`, `showOverall`, `labels` e `format`, com nome de formatador ou função, atravessam iguais.

Uma mudança de tipo, a mesma da rosca: `color` é papel de token (`chart-2`) e não cor de CSS. E uma de leitura: no web a peça é uma lista ordenada e o leitor de tela lê o nome, o número e a taxa em pedaços; aqui **cada etapa é uma parada só**, com os três na mesma frase ("Cadastros: 400, 40% da etapa anterior"), porque o leitor de tela do celular anda de elemento em elemento e três paradas por etapa triplicariam o caminho. Não há `label`: no toque não existe nome de lista, e o título do cartão faz esse papel.

As barras crescem do zero ao aparecer e andam até a largura nova quando os dados mudam, pelo Reanimated e com os tokens de movimento; com "reduzir movimento", nascem no lugar.

As partes vestem pelo mesmo `classNames` do web: `stage`, `bar` e `rate`.
