A biblioteca desenha a tela, e não cria rota nem busca dado: isso é do seu
aplicativo. Esta página mostra como ligar as peças ao TanStack Router e ao
TanStack Query, que é uma boa dupla para um app React feito do zero.

Nenhum dos dois é dependência do `@rivocode/ui`, e nem vai ser. As peças
recebem um link por `render` e o estado da consulta por prop (`data`,
`isLoading`, `isError`, `onRetry`), então funcionam com eles, com o React
Router, com o Next ou com `fetch` na mão. O que está aqui é só a ligação, que
cabe em poucas linhas no seu projeto.

```sh
npm install @tanstack/react-router @tanstack/react-query
```

## Rotas com o TanStack Router

### O link da casa, com a rota tipada

O `createLink` do Router embrulha o `Link` da biblioteca. O resultado tem o
desenho daqui e o `to` do Router: rota que não existe é erro de tipo, e os
parâmetros da rota são cobrados.

```tsx
import { createLink, type LinkComponent } from '@tanstack/react-router'
import { Link } from '@rivocode/ui'

const RivoLink = createLink(Link)

export const AppLink: LinkComponent<typeof Link> = (props) => (
  <RivoLink preload="intent" {...props} />
)
```

Crie esse arquivo uma vez no projeto e use o `AppLink` no lugar do `Link`. As
props da peça continuam valendo ao lado das do Router:

```tsx
<AppLink to="/notas/$id" params={{ id: '4816' }}>Nota 4816</AppLink>
<AppLink to="/notas" tone="neutral" underline="hover">Notas</AppLink>
```

O `preload="intent"` começa a carregar a rota quando o ponteiro passa por
cima do link, antes do clique. Tire-o se a rota for cara de carregar.

### Botão e item de menu que navegam

O `Button` e o `MenuLinkItem` recebem o link do Router pelo `render`. A tag
continua sendo de link, e o desenho é o da peça:

```tsx
import { Link as RouterLink } from '@tanstack/react-router'
import { Button, MenuLinkItem } from '@rivocode/ui'

<Button render={<RouterLink to="/notas/nova" />}>Nova nota</Button>

<MenuLinkItem render={<RouterLink to="/notas" />}>Notas</MenuLinkItem>
```

O `Link` do Router e o da biblioteca têm o mesmo nome, e por isso um deles é
renomeado na importação.

## Dados com o TanStack Query

### Os quatro finais de uma consulta

O `QueryBoundary` desenha o carregando, o erro, o vazio e o dado. A consulta
entrega os três primeiros, e o filho em função recebe o dado já sem o
`undefined`:

```tsx
import { useQuery } from '@tanstack/react-query'
import { QueryBoundary } from '@rivocode/ui'

const query = useQuery({ queryKey: ['notas'], queryFn: fetchInvoices })

<QueryBoundary
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={() => query.refetch()}
  empty={{
    title: 'Nenhuma nota por aqui',
    description: 'Quando você emitir a primeira, ela aparece nesta lista.',
  }}
>
  {(invoices) => <InvoiceList invoices={invoices} />}
</QueryBoundary>
```

Use `isLoading`, e não `isFetching`. O `isLoading` só é verdadeiro na
primeira busca, quando ainda não há nada para mostrar. O `isFetching` também é
verdadeiro quando a consulta busca de novo em segundo plano, e passá-lo
trocaria pelo esqueleto o que a pessoa já estava lendo.

### Tabela e gráfico

O `DataTable` e o `ChartContainer` já têm os quatro finais embutidos, com os
mesmos nomes de prop, então a consulta entra direto neles:

```tsx
<DataTable
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={() => query.refetch()}
  rowKey={(invoice) => invoice.id}
  columns={columns}
/>
```

### Paginação no servidor

O `DataTable` pagina sozinho quando recebe a lista inteira. Quando é o
servidor que pagina, a página atual vira parte da chave da consulta, e o
`Pagination` troca de página:

```tsx
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { DataTable, Pagination } from '@rivocode/ui'

const [page, setPage] = useState(1)
const query = useQuery({
  queryKey: ['notas', page],
  queryFn: () => fetchInvoices(page),
  placeholderData: keepPreviousData,
})

<div aria-busy={query.isFetching}>
  <DataTable
    data={query.data?.items}
    isLoading={query.isLoading}
    isError={query.isError}
    onRetry={() => query.refetch()}
    rowKey={(invoice) => invoice.id}
    columns={columns}
  />
</div>
{query.data && (
  <Pagination page={page} pageCount={query.data.pageCount} onPageChange={setPage} />
)}
```

O `keepPreviousData` segura a página anterior na tela enquanto a próxima
chega, em vez de piscar o esqueleto a cada clique. O `aria-busy` avisa o
leitor de tela de que a tabela está sendo atualizada.

### Salvar e avisar

Na escrita, o `useMutation` liga o `loading` do `Button` e o `useToast` avisa
o resultado. Invalidar a chave faz a lista buscar de novo:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, useToast } from '@rivocode/ui'

const toast = useToast()
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: createInvoice,
  onSuccess: (invoice) => {
    toast.add({ title: `Nota ${invoice.number} emitida`, type: 'success' })
    queryClient.invalidateQueries({ queryKey: ['notas'] })
  },
  onError: () => toast.add({ title: 'A emissão falhou', type: 'danger' }),
})

<Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
  Emitir nota
</Button>
```

## No React Native

O TanStack Query funciona igual, e o `QueryBoundary` do `@rivocode/ui-native`
tem os mesmos nomes de prop. O TanStack Router não é para o celular: no Expo quem
navega é o Expo Router, e as peças nativas navegam por `onPress`, porque ali
não há âncora para trocar:

```tsx
import { router } from 'expo-router'
import { Link } from '@rivocode/ui-native'

<Link href="/notas" onPress={() => router.push('/notas')}>Ver notas</Link>
```
