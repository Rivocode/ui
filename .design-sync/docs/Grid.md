---
category: Estrutura
---

# Grid

Arruma os filhos em linhas e colunas, com o mesmo vão do `Stack`.

```tsx
<Grid minItemWidth="12rem">
  {clientes.map((cliente) => (
    <Card key={cliente.id}>…</Card>
  ))}
</Grid>
```

São dois jeitos de dizer as colunas, e a escolha é a pergunta que a tela faz.

**`minItemWidth`: quantas couberem.** A grade põe quantas colunas couberem com
pelo menos essa largura e divide a sobra entre elas. No celular sai uma coluna,
no notebook três, no monitor largo cinco, sem media query escrita à mão. Aceita
número, lido em pixels, ou medida CSS como `"16rem"`. Numa tela mais estreita que
o próprio mínimo, o item ocupa a linha inteira em vez de vazar para o lado.

**`columns`: quantas eu disser.** Colunas fixas e de largura igual. Serve quando
o número de colunas é parte do desenho, como três indicadores lado a lado num
painel. Não muda com a tela, então confira em 390px antes de escolher.

Coluna fixa não protege conteúdo que não quebra. Cada coluna encolhe até caber
na tela, mas o que está dentro dela, não: `Badge`, botão e número em fonte
mono ficam numa linha só e passam por cima da coluna vizinha. Três `Badge`
com contagem em `columns={3}` se sobrepõem num celular de 390px. Para item
que não quebra, use `minItemWidth`, que desce para menos colunas quando falta
largura, ou um `Stack` em linha com `wrap`.

As duas juntas não combinam, e `minItemWidth` vence. Sem nenhuma das duas, sai
uma coluna só, com o vão entre as linhas.

A última linha não estica. Com cinco cartões em três colunas, os dois de baixo
ficam do tamanho dos de cima, e o lugar do terceiro fica vazio: cartão que muda
de largura conforme a quantidade parece defeito.

`gap` é a mesma escala do [`Stack`](/componentes/stack), de `xs` a `xl`, com o
mesmo passo menor na densidade compacta. `render` troca o elemento, como lá:
`<Grid render={<ul />}>` mantém a lista para o leitor de tela.

## Quando não usar

- **Quando uma `div` com classe basta.** Uma grade de duas colunas que só
  aparece no desktop é `grid gap-4 lg:grid-cols-2`, e ninguém ganha nada com a
  peça. O `Grid` se paga no `minItemWidth`, que o Tailwind não escreve sem valor
  arbitrário, e no vão que acompanha a densidade.
- **Uma direção só.** Campos um embaixo do outro, ou botões lado a lado, são
  `Stack`.
- **Dado em linha e coluna.** Nota, cliente e valor alinhados por coluna, com
  cabeçalho, são `Table` ou `DataTable`: o leitor de tela anuncia a coluna de
  cada célula, e a grade não anuncia nada.
- **Colunas que a pessoa redimensiona.** Lista e detalhe com divisória são o
  `Splitter`. A moldura de cada item continua sendo o `Card`, que o `Grid` não
  desenha.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Grid` - `columns`, `minItemWidth` em pontos e `gap`; a grade mede a própria largura para contar as colunas. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
