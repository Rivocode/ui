A roadmap for starting a project with `@rivocode/ui` and growing it without it
turning into a folder of loose components. It is not a mandatory template: it
is the path the house recommends, and each project adapts what it needs.

The roadmap applies to both ways of building the application:

| Base | When to use |
| --- | --- |
| **Vite** with TanStack Router | a logged-in system that runs in the browser: dashboard, back office, customer area |
| **Next.js** with App Router | when the page needs SEO or a server: public site, store, open page |

In both, data comes from TanStack Query and forms from `@rivocode/ui/form`.
Authentication is left out: each project wires its own.

## The folders: one per feature

```
src/
  app/                    the shell: routes, providers, AppShell
  features/
    invoices/
      schema.ts           the Zod schema, which is the source of the type
      api.ts              the calls to the server
      queries.ts          the TanStack Query hooks
      invoices-page.tsx   the screen
      invoice-form.tsx    the form
      schema.test.ts      the test
    dashboard/
  shared/                 what more than one feature uses
```

A new feature is a new folder in `features/`, and everything of it lives there:
the schema, the API, the screen and the test. **A feature does not import from
inside another**: what both need moves up to `shared/`. That is what lets you
delete, move or hand off a feature without hunting references across the
project, and what makes a thirty-screen project look like a three-screen one.

`app/` only assembles: route, provider and shell. Business rules do not live
there.

## What to install

```bash
npm install @rivocode/ui lucide-react @tanstack/react-query react-hook-form zod @hookform/resolvers
npm install -D tailwindcss
```

In Vite, add `@tanstack/react-router` and `@tailwindcss/vite`. In Next, add
`@tailwindcss/postcss`. The CSS and the Tailwind plugin follow
[Installation](/instalacao).

## The shell

`RivoProvider` goes in only once, outside everything, and `AppShell` assembles
the header, the sidebar and the content. The sidebar item takes the router
link through `render`: without it, every click reloads the whole page.

In Vite, with TanStack Router:

```tsx
// src/main.tsx
createRoot(document.getElementById('root')!).render(
  <RivoProvider theme="system">
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </RivoProvider>,
)
```

```tsx
// src/app/shell.tsx
import { Link as RouterLink, Outlet, useRouterState } from '@tanstack/react-router'

export function Shell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <AppShell
      container
      sidebar={
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem render={<RouterLink to="/notas" />} active={pathname === '/notas'}>
              Notas fiscais
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      }
    >
      <Outlet />
    </AppShell>
  )
}
```

Each screen goes into the route with `lazyRouteComponent`, and is only
downloaded when someone opens it:

```tsx
const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notas',
  component: lazyRouteComponent(() => import('../features/invoices/invoices-page'), 'InvoicesPage'),
})
```

In Next, the providers go in a client file, and the shell uses the `Link` from
`next/link` and `usePathname`:

```tsx
// src/app/providers.tsx
'use client'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <RivoProvider theme="system">
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </RivoProvider>
  )
}
```

```tsx
// src/app/shell.tsx
'use client'

<SidebarMenuItem render={<Link href="/notas" />} active={pathname === '/notas'}>
  Notas fiscais
</SidebarMenuItem>
```

The root `layout.tsx` wraps everything in
`<Providers><Shell>{children}</Shell></Providers>`, and each `page.tsx` only
renders the feature's screen.

## A whole feature

**The schema is the source of truth.** It validates the form and gives the
type, and the Brazilian field takes the library's validator:

```ts
// src/features/invoices/schema.ts
export const invoiceSchema = z.object({
  customer: z.string().trim().min(2, 'Informe o nome do cliente'),
  document: z.string().refine(isValidCnpj, 'CNPJ inválido: confira os dígitos'),
  amount: z.number().int().positive('O valor precisa ser maior que zero'),
})
```

**The query lives in a hook**, and the screen does not know where the data
comes from:

```ts
// src/features/invoices/queries.ts
export function useInvoices() {
  return useQuery({ queryKey: ['notas'], queryFn: listInvoices })
}

export function useCreateInvoice() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => client.invalidateQueries({ queryKey: ['notas'] }),
  })
}
```

**The screen draws the four end states**, and not just the happy path:

```tsx
<DataTable
  data={invoices.data}
  isLoading={invoices.isLoading}
  isError={invoices.isError}
  onRetry={() => invoices.refetch()}
  rowKey={(row) => row.id}
  columns={columns}
  empty={{
    title: 'Nenhuma nota por aqui',
    description: 'Quando você emitir a primeira, ela aparece nesta lista.',
    action: <Button onClick={() => setCreating(true)}>Emitir a primeira nota</Button>,
  }}
/>
```

**The form uses the right piece for each piece of data**: mask and validator
on the CNPJ, integer cents for money.

```tsx
<Form form={form} onSubmit={onSubmit}>
  <FormField name="customer" label="Cliente">
    {(field) => <Input {...field} autoComplete="organization" />}
  </FormField>
  <FormField name="document" label="CNPJ do cliente">
    {(field) => <MaskedInput {...forValue(field)} mask="cnpj" />}
  </FormField>
  <FormField name="amount" label="Valor">
    {(field) => <CurrencyInput {...forValue(field)} />}
  </FormField>
  <Button type="submit" loading={form.formState.isSubmitting}>
    Emitir nota
  </Button>
</Form>
```

**Deleting offers undo**, instead of asking for confirmation:

```tsx
async function removeWithUndo(invoice: Invoice) {
  await remove.mutateAsync(invoice.id)
  const id = toast.add({
    title: `Nota ${invoice.number} excluída`,
    timeout: 8000,
    actionProps: {
      children: 'Desfazer',
      onClick: () => {
        restore.mutate(invoice)
        toast.close(id)
      },
    },
  })
}
```

Create and edit open in a `Sheet` beside the list, which keeps the context
behind it. The reason for each of these choices is in the
[Skill](/skill)'s flow guide.

## The agent working the house way

Three files at the project root make Claude Code, Cursor or another agent
follow this roadmap on its own:

- **The skill**, with `npx rivocode-ui skill`: the library contract, choosing
  pieces and the flow rules.
- **The MCP**, in `.mcp.json`:

```json
{
  "mcpServers": {
    "rivocode-ui": { "command": "npx", "args": ["-y", "@rivocode/ui-mcp"] }
  }
}
```

- **A `CLAUDE.md`** that states the architecture: where each thing lives, that
  a feature does not import from another, and the interface rules (the catalog
  piece before the `<div>`, the field that comes from the data, the four end
  states and undo). The MCP's screen audit, `audit_screen`, scores a finished
  screen.

## Tests and CI

One test per feature, starting with the schema, which is where the rule lives:

```ts
test('rejects a CNPJ with a wrong digit', () => {
  const result = invoiceSchema.safeParse({
    customer: 'Clínica São Lucas',
    document: '11.222.333/0001-80',
    amount: 128_000,
  })

  expect(result.success).toBe(false)
})
```

And CI runs types, tests and build on every push, so `main` never receives what
does not compile.
