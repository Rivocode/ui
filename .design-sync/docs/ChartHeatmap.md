---
category: Gráfico
---

# ChartHeatmap

Uma grade de linhas por colunas em que a cor de cada célula diz o tamanho do
número: notas emitidas por dia da semana e hora, chamados por equipe e semana.

```tsx
<ChartHeatmap
  data={emissoes}
  rowKey="dia"
  columnKey="hora"
  valueKey="total"
  rows={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']}
  label="Notas emitidas por dia da semana e hora"
/>
```

O `data` vem no formato longo, uma linha por célula, que é o que um
`GROUP BY dia, hora` devolve. `rows` e `columns` dão a ordem e trazem para a
grade a linha que não teve nenhum registro: sem eles, o domingo sem emissão
some da tabela em vez de aparecer vazio.

## A escala

São cinco degraus de uma cor só, do mais ralo ao mais cheio. O degrau mais forte
é a própria cor da série (`var(--rc-chart-1)`, ou a do `color`) e os quatro de
baixo são ela mesma em tinta mais rala sobre o fundo, então a escala acompanha o
tema sem nenhuma cor nova. A régua embaixo mostra os cinco degraus entre o menor
e o maior número.

O intervalo sai dos dados: de zero (ou do menor valor, se houver negativo) até o
maior. Duas grades lado a lado que precisam ser comparadas pedem a **mesma
régua**, e é para isso que existe o `domain`: sem ele, o degrau mais cheio de
cada uma quer dizer um número diferente.

Os rótulos de coluna aparecem de tanto em tanto quando não cabem todos: a
peça mede a largura das células, sem a coluna dos rótulos de linha, e deixa uns
quarenta pixels para cada rótulo que escreve, então 24 horas num cartão de
celular saem de quatro em quatro, sem reticências. O rótulo que não aparece
continua na tabela do leitor de tela.

O rótulo de linha ocupa o que precisa até 40% da grade, e nunca mais de
`10rem`: o nome comprido de um cliente termina em reticências, e o resto da
largura fica com as células. O nome inteiro está na dica e na tabela.

Uma grade sem variação (tudo zero, ou um `domain` com os dois números iguais)
pinta o degrau mais ralo, e não o mais cheio: sem diferença para mostrar, a
grade não grita.

## Zero não é vazio

A célula com `0` é um valor, e pinta o primeiro degrau. A célula sem dado
(a combinação que não veio no `data`, ou veio com `null`) não tem tinta
nenhuma e leva uma borda tracejada. Os dois se leem diferentes de propósito:
"ninguém emitiu às 22h" e "não apuramos as 22h" são respostas diferentes à mesma
pergunta, e uma grade que pinta os dois do mesmo jeito mente numa delas. A dica,
a tabela escondida e a régua dizem "Sem dado", ou o que você escrever em
`emptyLabel`.

## Dica, teclado e leitor de tela

O ponteiro sobre uma célula abre a dica com a linha, a coluna e o número. A
grade inteira é **uma parada só** no Tab, e dali as setas andam célula a
célula (`Home` e `End` vão às pontas da linha, e com `Ctrl` às pontas da
grade), com a mesma dica aberta e o mesmo texto anunciado. Cento e sessenta e oito
paradas de Tab dentro de um cartão seriam um obstáculo, e é a mesma decisão do
`Tracker`.

Para o leitor de tela o desenho não é a fonte: ao lado dele há uma **tabela de
verdade**, escondida da vista, com a legenda que você escreveu em `label`, a
linha e a coluna como cabeçalhos e o número escrito em cada célula. É ela que se
navega com os comandos de tabela, e é por isso que `label` é obrigatório.

## O número não entra na célula

Numa grade de sete por vinte e quatro a célula tem vinte e poucos pixels, e o
número escrito ali não cabe nem se lê. Ele mora na dica e na tabela. Quando a
pergunta é o número exato de cada cruzamento, e não o padrão, a peça certa é o
`DataTable`.

## Movimento

A grade entra esmaecendo, e quando os dados mudam cada célula troca de degrau
em `--rc-duration-slow`. Com "reduzir movimento", a troca é seca.

## Quando não usar

Uma linha só, um estado por período, é o `Tracker`: ele mostra se cada dia foi
bom ou ruim, e não quanto. Uma série só ao longo do tempo é `LineChart` dentro
do `ChartContainer`, que mostra a tendência que a cor esconde. E poucas
categorias com o valor como assunto são barra deitada: a cor é o jeito menos
preciso de comparar dois números, e o heatmap só se paga quando o assunto é o
**padrão** que aparece na grade inteira.

A peça não tem os quatro finais de uma consulta: carregando, erro e vazio vêm do
`QueryBoundary` em volta dela.

## No React Native

Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `rowKey`, `columnKey`, `valueKey`, `rows`, `columns`, `domain`, `emptyLabel`, `legend`, `format`. A escala é a mesma, cinco degraus de uma cor só, e os alfas vêm da mesma constante do web, gerada em `native/src/shared/`. Zero pinta o primeiro degrau e a célula sem dado tem borda tracejada, igual.

Uma mudança de tipo: `color` é papel de token (`chart-3`).

**O que muda é como se lê uma célula.** No web o ponteiro pousa e a dica abre, e o leitor de tela navega uma tabela escondida. No celular não há dica nem tabela: o dedo toca ou arrasta sobre a grade e escolhe a célula debaixo dele, que ganha contorno, e a linha, a coluna e o número aparecem escritos embaixo da grade. Para o leitor de tela a grade é **uma parada `adjustable` só**, que anda célula a célula com o gesto de subir e descer, a mesma decisão do `Tracker`: cento e sessenta e oito paradas dentro de um cartão seriam um obstáculo, e o valor de cada uma vai inteiro no `accessibilityValue`.

Os rótulos de coluna aparecem no máximo seis, e não pela largura medida como no web: a tela do celular é estreita sempre, e o rótulo que não aparece continua sendo dito na leitura.
