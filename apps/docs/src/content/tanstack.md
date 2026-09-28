The library draws the screen, and does not create routes or fetch data: that
belongs to your application. This page shows how to connect the pieces to
TanStack Router and TanStack Query, which make a good pair for a React app
built from scratch.

Neither of them is a dependency of `@rivocode/ui`, and neither will be. The
pieces take a link through `render` and the query state through props
(`data`, `isLoading`, `isError`, `onRetry`), so they work with them, with
React Router, with Next or with a hand-written `fetch`. What is here is only
the wiring, which fits in a few lines in your project.

```sh
npm install @tanstack/react-router @tanstack/react-query
```

## Routes with TanStack Router

### The house link, with a typed route

The Router's `createLink` wraps the library's `Link`. The result has the design
from here and the Router's `to`: a route that does not exist is a type error,
and the route params are enforced.

```tsx
import { createLink, type LinkComponent } from '@tanstack/react-router'
import { Link } from '@rivocode/ui'

const RivoLink = createLink(Link)

export const AppLink: LinkComponent<typeof Link> = (props) => (
  <RivoLink preload="intent" {...props} />
)
```

Create that file once in the project and use `AppLink` in place of `Link`. The
piece's props still apply alongside the Router's:

```tsx
<AppLink to="/notas/$id" params={{ id: '4816' }}>Nota 4816</AppLink>
<AppLink to="/notas" tone="neutral" underline="hover">Notas</AppLink>
```

`preload="intent"` starts loading the route when the pointer passes over the
link, before the click. Remove it if the route is expensive to load.

### Button, menu item and sidebar that navigate

`Button`, `MenuLinkItem` and `SidebarMenuItem` take the Router link through
`render`. The tag is still a link, and the design is the piece's:

```tsx
import { Link as RouterLink } from '@tanstack/react-router'
import { Button, MenuLinkItem, SidebarMenuItem } from '@rivocode/ui'

<Button render={<RouterLink to="/notas/nova" />}>Nova nota</Button>

<MenuLinkItem render={<RouterLink to="/notas" />}>Notas</MenuLinkItem>

<SidebarMenuItem render={<RouterLink to="/notas" />} active>
  Notas fiscais
</SidebarMenuItem>
```

Without `render`, the sidebar item is a plain `<a href>`, and every click
reloads the whole page.

The Router's `Link` and the library's have the same name, which is why one of
them is renamed on import.

## Data with TanStack Query

### The four end states of a query

`QueryBoundary` draws loading, error, empty and the data. The query delivers
the first three, and the function child receives the data already without
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

Use `isLoading`, not `isFetching`. `isLoading` is only true on the first
fetch, when there is nothing to show yet. `isFetching` is also true when the
query fetches again in the background, and passing it would swap what the
person was already reading for the skeleton.

### Table and chart

`DataTable` and `ChartContainer` already have the four end states built in,
with the same prop names, so the query goes straight into them:

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

### Server-side pagination

`DataTable` paginates on its own when it gets the whole list. When the server
paginates, the current page becomes part of the query key, and `Pagination`
changes the page:

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

`keepPreviousData` holds the previous page on screen while the next one
arrives, instead of flashing the skeleton on every click. `aria-busy` tells the
screen reader the table is being updated.

### Save and notify

On writes, `useMutation` drives the `Button`'s `loading` and `useToast`
reports the result. Invalidating the key makes the list fetch again:

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

## In React Native

TanStack Query works the same, and `@rivocode/ui-native`'s `QueryBoundary` has
the same prop names. TanStack Router is not for mobile: in Expo, Expo Router
does the navigating, and the native pieces navigate through `onPress`, because
there is no anchor to swap there:

```tsx
import { router } from 'expo-router'
import { Link } from '@rivocode/ui-native'

<Link href="/notas" onPress={() => router.push('/notas')}>Ver notas</Link>
```
