---
category: Gráfico
---

# ChartTreemap

Um retângulo repartido em áreas proporcionais ao valor de cada categoria: o
faturamento do mês por item da lista de serviço, o armazenamento por tipo de
arquivo.

```tsx
<ChartTreemap
  data={porServico}
  valueKey="total"
  nameKey="codigo"
  config={servicos}
  format="currencyShort"
  label="Faturamento do mês por item da lista de serviço"
  className="h-72"
/>
```

A área sai de um algoritmo de retângulos quase quadrados (o *squarified* de
Bruls, Huizing e van Wijk), que é o que deixa comparar tamanho a olho. O
`config` é o mesmo da rosca: nome legível e cor por categoria, e sem cor cada
uma pega a próxima da paleta, na ordem de `data`. **A altura é sua, por classe**:
sem ela, `h-64`.

## O rótulo some quando não cabe

Cada retângulo escreve o nome e o valor quando cabem os dois, só o nome quando
só cabe uma linha, e **nada** quando nem o nome cabe inteiro. Não há reticências:
"Retenç…" num retângulo de quarenta pixels não diz qual categoria é, e ocupa o
lugar que faria o retângulo se ler como pequeno, que é a informação certa. A
conta usa a medida real da caixa, e antes de a caixa ser medida nenhum rótulo é
desenhado, em vez de adivinhar.

O que some do desenho continua em três lugares: na dica, que o ponteiro abre
sobre qualquer retângulo; no teclado, porque o mapa é uma parada só no Tab e as
setas percorrem as categorias de cima para baixo; e numa lista escondida da
vista, com nome, valor e fatia de cada uma, que é o que o leitor de tela lê.
Categoria com zero, que não ganha área nenhuma, também está nela.

## As cores e o contraste

O retângulo é a cor da categoria a 30% sobre o fundo, com um contorno na cor
cheia, e o rótulo é escrito em `fg` por cima. Não é a cor cheia com texto claro,
e a razão é medida: a lima escura do tema claro com texto branco dá 4,10:1,
abaixo dos 4,5 de texto. Na tinta a 30%, o pior par das oito cores de série
nos dois temas é 6,77:1, e a guarda de contraste mede os dezesseis a cada
commit. Cor escrita à mão no `config` não entra nessa medida.

## Movimento

O mapa entra esmaecendo, e quando os dados mudam cada retângulo anda até a
posição e o tamanho novos em `--rc-duration-slow`. Com "reduzir movimento", a
troca é seca.

## Quando não usar

Até seis categorias, o `ChartDonut` responde a mesma pergunta com um total no
meio e uma legenda que nunca some. Quando o número exato importa mais que a
proporção, barra deitada: comparar área é menos preciso que comparar
comprimento. E quando a hierarquia é para **navegar**, abrir uma pasta e ver o
que tem dentro, é o `Tree`: o treemap mostra um nível só, e não é clicável.

## No React Native

Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `valueKey`, `nameKey`, `config`, `format`. A geometria é a mesma função do web (o *squarified*, gerado em `native/src/shared/`), e a regra do rótulo também: nome e valor quando cabem os dois, só o nome quando cabe uma linha, nada quando nem o nome cabe, e nada antes do `onLayout` medir a caixa. A tinta a 30% com `fg` por cima é a mesma, e os dezesseis pares estão no mapa de contraste do nativo.

Duas mudanças de tipo: o `config.color` é papel de token, como em toda a família, e `format` só aceita função.

**O que muda é como se lê uma categoria.** Aqui são poucas (acima de uma dúzia o treemap para de informar), e poucas categorias viram poucas paradas: cada retângulo é um botão com nome, valor e fatia, a decisão da legenda da rosca e não a do `Tracker`. Tocar acende o contorno e escreve a leitura embaixo, no lugar da dica do web; tocar de novo apaga. Por isso não há `label`: o web o usa para nomear o grupo e a lista escondida, e no celular nem um nem outro existe. O título do cartão faz esse papel.
