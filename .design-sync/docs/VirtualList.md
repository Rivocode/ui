---
category: Estrutura
---

# VirtualList

Lista longa que desenha só o que cabe na moldura.

O virtualizador já estava pago: o `DataTable` usa a mesma engrenagem desde que
o painel de log entrou. O que faltava era a lista que não é tabela (o feed, o
histórico de eventos, o seletor de dois mil clientes), e que até aqui ou
montava dez mil `<li>` no DOM ou empurrava a pessoa para a paginação no
servidor.

```tsx
<VirtualList
  items={events}            // 4 mil itens
  itemKey={(event) => event.id}
  maxHeight={360}
  label="Log de envio de notas"
  renderItem={(event) => (
    <Item className="px-3">
      <ItemContent>
        <ItemTitle>{event.message}</ItemTitle>
        <ItemDescription>{event.at}</ItemDescription>
      </ItemContent>
    </Item>
  )}
/>
```

`renderItem` desenha um item; a peça cuida de quantos existem, de quais estão
na tela e de quanto espaço os ausentes ocupam.

## A partir de quantos itens

**Abaixo de duzentos, não use.** Uma lista curta virtualizada é complexidade
paga sem retorno: entram uma altura obrigatória, um palpite de altura por item
e um contêiner que rola por dentro, e o que se ganha são alguns milissegundos
que ninguém sente. Duzentas linhas comuns montam em menos de um quadro.

Entre duzentos e uns dois mil, é escolha: se cada item for pesado (imagem,
gráfico, um menu por linha), virtualizar já paga; se for texto, não.

**Acima de dois mil, use.** É onde a montagem inicial passa a travar o clique
que abriu a tela, e é o ponto em que a `ScrollArea` com tudo no DOM começa a
custar memória de verdade no celular.

## A altura do item, que é a decisão da peça

Virtualizar é prometer, antes de desenhar, quanto espaço o que não foi
desenhado vai ocupar. Toda a peça sai daí.

- **`itemHeight`** (padrão 44, o mesmo do `rowHeight` do `DataTable`) é o
  palpite. É ele que dá comprimento à barra de rolagem antes de o item existir.
  Aceita número ou função por índice, para a lista que alterna item simples e
  item duplo.
- **`measure`** (ligado de saída) faz cada item desenhado devolver a altura
  real, e a rolagem se corrigir. É o que segura texto que quebra em duas linhas
  a 390px: com o palpite sozinho, o item de duas linhas invade o de baixo e a
  barra promete um fim que não chega.

Com `measure` ligado, `itemHeight` só precisa estar perto: quem ainda não foi
desenhado continua valendo o palpite, e o que já passou pela tela vale a medida.
Por isso a barra de rolagem de uma lista de alturas variadas se ajusta enquanto
se rola, e isso é honesto: a alternativa seria medir quatro mil itens na
montagem, que é exatamente o custo que a peça existe para não pagar.

**Desligue `measure` quando a altura for cravada por CSS.** Aí `itemHeight` é a
lei, a peça aplica essa altura em cada item, e você economiza um observador de
tamanho por item visível. É o caso do log de largura fixa com uma linha por
evento.

`itemKey` não é só chave de React: é por ela que a altura medida segue o item
quando a lista reordena ou filtra. Índice serve e quebra na primeira reordenação:
o item que era o terceiro herda a altura de quem estava ali.

## Rolagem dentro da própria moldura

`maxHeight` é obrigatória, e é a diferença para a irmã do `DataTable`, onde ela
é opcional: sem altura não há o que caber, e uma lista virtualizada sem moldura
desenha um item só. A moldura é a mesma da tabela (borda, canto e superfície
iguais), ela rola por dentro em vez de empurrar a página, e é decisão escrita
da casa desde a tabela.

`gap` põe respiro entre um item e o próximo sem que ele conte como altura de
item. Margem dentro do `renderItem` não serve: a medida de um item é a caixa
dele, e margem fica de fora. O resultado é uma lista que encolhe um pouco a
cada item.

## Contagem para o leitor de tela

Uma lista virtualizada mente por construção: com vinte itens no DOM e quatro
mil na mão, o leitor de tela anuncia "item 3 de 20". O `DataTable` resolveu isso
com `aria-rowcount` na tabela e `aria-rowindex` em cada linha; aqui vale o par
equivalente de lista: **`aria-setsize` com o total e `aria-posinset` com a
posição real** em cada item. Quem ouve ouve "3 de 4000", que é o que existe.

A peça sai como `role="list"` com `role="listitem"` dentro, e `label` é o nome
dessa lista. Sem ele, ela é anunciada como uma lista sem nome no meio da tela.
E numa tela que tem três, isso não distingue nenhuma.

Carregando não há lista nenhuma: o esqueleto sai marcado com `aria-hidden` e a
região não se anuncia como lista de quatro itens que não existem.

## Ir até um item que não está na tela

Item que não foi desenhado não tem elemento, então `scrollIntoView` não alcança.
`ref` recebe um `VirtualListHandle`, que tem `scrollToIndex(index, { align })`:
`start`, `center`, `end` ou `auto`. É como se vai ao fim de um log ou se pula
para o resultado de uma busca.

```tsx
const list = useRef<VirtualListHandle>(null)

<Button onClick={() => list.current?.scrollToIndex(events.length - 1, { align: 'end' })}>
  Último
</Button>
<VirtualList ref={list} items={events} /* … */ />
```

## Os quatro estados

Os mesmos do `DataTable`, na mesma ordem e com os mesmos nomes de prop: erro
vence carregando, e vazio só vale depois que a consulta voltou. `isLoading` e
`items === undefined` são a mesma coisa; `skeletonItems` diz quantos itens
falsos aparecem, e cada um ocupa a altura de `itemHeight`, para a moldura não
pular quando os dados chegam. `errorTitle`, `errorMessage` e `onRetry` são o par
de erro, e `empty` é o estado vazio com descrição obrigatória.

## Partes

`classNames` veste cada parte sem ninguém alcançar o nó interno por `[&>div>div]`:

- **`list`**: a faixa de altura total que rola por dentro da moldura.
- **`item`**: a caixa posicionada de cada item, onde entra o que `renderItem`
  devolve.

`className` continua sendo a moldura, e é onde se tira a borda quando a lista é
de cartões soltos.

## O item interativo vem do `renderItem`

Não há `onItemClick`. Uma `<div>` que responde ao clique não responde ao Enter,
e uma lista de mil dessas é mil alvos que o teclado não alcança. Quem precisa de
item clicável devolve o alvo de verdade: `<Item interactive render={<a />}>` ou
`<Item interactive render={<button />}>`, que já trazem foco visível e cor de
passagem.

## Quando não usar

**Se o dado é tabular, use `DataTable`.** Ela já virtualiza (`maxHeight` mais
`virtual`), e leva junto o que uma lista não tem: coluna com cabeçalho,
ordenação, filtro que ignora acento, seleção e linha de totais alinhada com as
colunas. Uma listagem de notas fiscais montada com `VirtualList` é uma tabela
reconstruída à mão, e a primeira coisa que se perde é o alinhamento entre
colunas.

**Se a lista é curta, use `ScrollArea`.** Ela é a moldura de rolagem sem
virtualização nenhuma: nada de altura de item, nada de palpite, nada de
`aria-setsize`. Para as trinta notas de um painel lateral, é a peça certa, e a
`VirtualList` ali só acrescenta uma prop obrigatória a mais e uma altura para
você adivinhar.

## No React Native

Não porta, e não é fila: **a plataforma já resolve**. A `FlatList` do React Native virtualiza de fábrica, e o `DataList` daqui já a usa por baixo. Uma peça nossa por cima seria embrulho de embrulho, e cobraria manutenção para reimplementar o que o sistema entrega, com pior desempenho, porque a `FlatList` roda parte do trabalho fora da ponte de JavaScript.

O que o web tinha de próprio, e que a `FlatList` não dá sozinha, são os quatro finais e a contagem honesta para o leitor de tela. Os dois já estão no `DataList`: use ele para lista longa que veio de consulta, e a `FlatList` crua para lista longa que você já tem na mão.
