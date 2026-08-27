---
category: Feedback
---

# QueryBoundary

Os quatro finais de uma consulta (carregando, erro, vazio e dados) em volta de
qualquer conteúdo.

O `DataTable` e o `ChartContainer` já os têm embutidos, e o resto da tela não:
cada cartão de resumo, cada folha de detalhes e cada lista desenhada à mão
reescreve a mesma escada de `if`. Esta peça é essa escada, com os mesmos nomes
de prop das duas: `isLoading`, `isError`, `onRetry`, `errorTitle`,
`errorMessage` e `empty`.

```tsx
<QueryBoundary
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  empty={{
    title: 'Nenhuma nota por aqui',
    description: 'Quando você emitir a primeira, ela aparece nesta lista.',
  }}
>
  {(invoices) => <Invoices invoices={invoices} />}
</QueryBoundary>
```

Não conhece React Query, e isso é de propósito: entram três booleanos e uma
resposta, e funciona igual com `fetch` na mão, com SWR ou com server component.

**A ordem é a mesma das duas irmãs:** erro vence carregando, e vazio só vale
depois que a resposta chegou. Sem isso, uma nova busca sobre um erro pisca
"nenhum resultado" antes de mostrar o problema.

## O filho pode ser função

Como função, ela só é chamada depois que o dado chegou, e recebe o `data` sem o
`undefined`, que é exatamente o `!` que toda tela escrevia aqui. Como nó,
serve a quem não precisa do dado para desenhar:

```tsx
<QueryBoundary data={customer}>
  {(customer) => <DescriptionItem label="Cliente">{customer.name}</DescriptionItem>}
</QueryBoundary>
```

Com filho em função, `data` indefinido continua sendo espera mesmo com
`isLoading={false}`. Não há o que entregar à função, e é a regra do
`DataTable`. Com filho em nó, `isLoading` manda sozinho quando você o passa: o
nó não depende do dado para existir.

A função não atravessa a fronteira de um server component: ela não é
serializável. De um server component, passe o filho como nó.

**Os filhos saem como você os escreveu, sem embrulho.** A peça não põe uma
`<div>` em volta do que ela devolve: uma moldura invisível quebraria o `grid`
ou o `flex` de quem está por fora, e o defeito só apareceria no navegador.

## A espera

O padrão são três linhas de `Skeleton`, e elas seguram altura sem prometer
forma nenhuma. `skeletonRows` muda quantas, o mesmo nome do `DataTable`.

Quando a forma do que vem importa (e ela quase sempre importa), passe o seu
molde em `skeleton`:

```tsx
<QueryBoundary
  isLoading={query.isLoading}
  skeleton={
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-24" />
    </div>
  }
>
```

Não é `Spinner` de propósito, e é a mesma escolha das duas irmãs: o giro no meio
do vazio não reserva altura, então a página pula quando o conteúdo chega. O
`Spinner` continua sendo o certo para a espera que não tem forma: o botão que
envia, a ação que não desenha nada.

O nó do carregando sai com `aria-busy="true"`. O `Skeleton` se esconde do leitor
de tela de propósito, e é no contêiner que o aviso de carregamento pertence.

## Quem decide o vazio

A peça decide sozinha, pelo `data`: **lista de tamanho zero e `null` são
vazio**, e `undefined` é "ainda não chegou". Sem `isLoading`, é ele quem liga o
carregando.

Para a resposta que não é uma lista (`{ items: [], total: 0 }` é a paginada de
sempre), quem responde é `isEmpty`, que vence a contagem quando vem:

```tsx
<QueryBoundary data={page} isEmpty={page.total === 0} empty={{ ... }}>
```

Se `empty` chegar sem que nada consiga decidir, a peça avisa no console em
desenvolvimento. O estado vazio que nunca aparece é silencioso: os filhos
desenham sobre o nada, e ninguém descobre até um cliente abrir a tela sem dados.

Sem `empty`, não há estado vazio. A resposta vazia cai nos filhos, e eles
desenham o vazio deles. A exceção é o `null` com filho em função: sem dado para
entregar e sem vazio configurado, a peça não desenha nada.

A descrição é obrigatória pelo mesmo motivo do `DataTable`: "nenhum resultado"
transfere para a pessoa o trabalho de descobrir por quê, e ela quase nunca
descobre.

## Os textos que a peça escreve

`errorTitle` (padrão "Não foi possível carregar") e `errorMessage` (padrão
"Tente de novo em alguns minutos.") são o par do estado de erro, com os mesmos
nomes e o mesmo papel que têm no `DataTable` e no `ChartContainer`: uma tela que
carrega três blocos precisa dizer qual deles falhou, e um produto que não fala
português precisa dizer isso em outra língua.

Sem `onRetry` não há botão de nova tentativa. Aviso com botão que não leva a
lugar nenhum é pior que aviso sem botão.

## Partes

`classNames` veste cada final: `loading`, `error`, `empty`. O `className` veste
os três de uma vez, que é onde mora a moldura que reserva a altura
(`className="min-h-40"`). E não veste os filhos, que são seus.

## Quando não usar

**Não embrulhe `DataTable` nem `ChartContainer`.** As duas já recebem os quatro
finais, com estas mesmas props, e desenham a espera no formato do que elas
mesmas mostram: linhas falsas de tabela, barras falsas de gráfico. Por fora,
uma moldura só teria um esqueleto genérico para oferecer, e os dois estados de
erro empilhados apareceriam juntos no dia em que a consulta falhasse.

Para o estado vazio sozinho (uma tela que nunca carrega nada, um resultado que
já está na mão), use `EmptyState`. Para o aviso de erro que não é o fim de uma
consulta, `Alert`. Para a marca de lugar solta dentro de um bloco que já tem os
outros finais tratados, `Skeleton`. Esta peça existe para os quatro juntos, e na
ordem; um só deles não paga o embrulho.

Ela também não captura exceção de renderização: `QueryBoundary` mostra o erro
que a consulta reportou em `isError`, e não o que estourou dentro dos filhos.
Para esse, o que existe é o error boundary do React.

## No React Native

Traduz com os mesmos nomes de prop e a mesma ordem: **erro vence carregando**, e vazio só vale depois que a resposta chegou. O `children` também aceita função aqui, que é o que justifica a peça existir: ela entrega o dado já sem `undefined`, e mata o `!` que a tela escrevia.

Três diferenças de tipo, todas porque texto no nativo mora dentro de um `Text`: `errorTitle`, `errorMessage`, `empty.title` e `empty.description` são `string`, e `empty.icon` não existe, porque o `EmptyState` nativo ainda não tem esse slot. É a mesma nota que o `ChartContainer` já carrega.

**`classNames` não porta, e a razão não é preguiça:** a prop existe no web para que ninguém alcance o nó interno por `[&_div]` e acople a tela à árvore da peça. No React Native não há seletor de descendente, então essa escotilha não existe e a prop não teria o que evitar. O `className` veste os três finais, como no web.

O esqueleto genérico fica na peça, e não vem de quem chama: sem ele, `isLoading` sem `skeleton` colapsaria a tela para altura zero e ela pularia quando o dado chegasse. No celular isso dói mais, porque não há barra de rolagem nem indicador de rede para explicar a espera.
