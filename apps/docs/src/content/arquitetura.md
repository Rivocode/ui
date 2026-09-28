Um roteiro para começar um projeto com o `@rivocode/ui` e fazê-lo crescer sem
virar uma pasta de componentes soltos. Não é molde obrigatório: é o caminho que
a casa recomenda, e cada projeto adapta o que precisar.

O roteiro vale para os dois jeitos de montar a aplicação:

| Base | Quando usar |
| --- | --- |
| **Vite** com TanStack Router | sistema logado, que roda no navegador: painel, gestão, área do cliente |
| **Next.js** com App Router | quando a página precisa de SEO ou de servidor: site público, loja, página aberta |

Nos dois, os dados vêm do TanStack Query e os formulários do
`@rivocode/ui/form`. Autenticação fica de fora: cada projeto liga a sua.

## As pastas: uma por funcionalidade

```
src/
  app/                 a casca: rotas, providers, AppShell
  features/
    notas/
      schema.ts        o Zod, que é a fonte do tipo
      api.ts           as chamadas ao servidor
      queries.ts       os hooks do TanStack Query
      notas-page.tsx   a tela
      invoice-form.tsx o formulário
      schema.test.ts   o teste
    painel/
  shared/              o que mais de uma funcionalidade usa
```

Funcionalidade nova é uma pasta nova em `features/`, e tudo dela mora ali: o
schema, a API, a tela e o teste. **Uma funcionalidade não importa de dentro da
outra**: o que as duas precisam sobe para `shared/`. É o que deixa apagar,
mover ou entregar uma funcionalidade sem caçar referência pelo projeto, e o que
faz o projeto de trinta telas ter a mesma cara do de três.

`app/` só monta: rota, provider e casca. Regra de negócio não mora lá.

## O que instalar

```bash
npm install @rivocode/ui lucide-react @tanstack/react-query react-hook-form zod @hookform/resolvers
npm install -D tailwindcss
```

No Vite, mais `@tanstack/react-router` e `@tailwindcss/vite`. No Next, mais
`@tailwindcss/postcss`. O CSS e o plugin do Tailwind seguem a
[Instalação](/instalacao).

## A casca

O `RivoProvider` fica uma vez só, por fora de tudo, e o `AppShell` monta o
cabeçalho, a barra lateral e o conteúdo. O item da barra lateral recebe o link
do router pelo `render`: sem ele, cada clique recarrega a página inteira.

No Vite, com o TanStack Router:

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

Cada tela entra na rota com `lazyRouteComponent`, e só é baixada quando alguém a
abre:

```tsx
const notasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notas',
  component: lazyRouteComponent(() => import('../features/notas/notas-page'), 'NotasPage'),
})
```

No Next, os providers vão num arquivo de cliente, e a casca usa o `Link` de
`next/link` e o `usePathname`:

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

O `layout.tsx` da raiz embrulha tudo em `<Providers><Shell>{children}</Shell></Providers>`,
e cada `page.tsx` só renderiza a tela da funcionalidade.

## Uma funcionalidade inteira

**O schema é a fonte da verdade.** Ele valida o formulário e dá o tipo, e o
campo brasileiro leva o validador da biblioteca:

```ts
// src/features/notas/schema.ts
export const invoiceSchema = z.object({
  customer: z.string().trim().min(2, 'Informe o nome do cliente'),
  document: z.string().refine(isValidCnpj, 'CNPJ inválido: confira os dígitos'),
  amount: z.number().int().positive('O valor precisa ser maior que zero'),
})
```

**A consulta mora num hook**, e a tela não sabe de onde o dado vem:

```ts
// src/features/notas/queries.ts
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

**A tela desenha os quatro finais**, e não só o caminho feliz:

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

**O formulário usa a peça certa para cada dado**: máscara e validador no CNPJ,
centavos inteiros no dinheiro.

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

**Excluir oferece desfazer**, em vez de pedir confirmação:

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

Criar e editar abrem numa `Sheet` ao lado da lista, que mantém o contexto de
trás. O motivo de cada uma dessas escolhas está no guia de fluxo da
[Skill](/skill).

## O agente trabalhando do jeito da casa

Três arquivos na raiz do projeto fazem o Claude Code, o Cursor ou outro agente
seguir este roteiro sozinho:

- **A skill**, com `npx rivocode-ui skill`: o contrato da biblioteca, a escolha
  de peça e as regras de fluxo.
- **O MCP**, em `.mcp.json`:

```json
{
  "mcpServers": {
    "rivocode-ui": { "command": "npx", "args": ["-y", "@rivocode/ui-mcp"] }
  }
}
```

- **Um `CLAUDE.md`** que diga a arquitetura: onde mora cada coisa, que
  funcionalidade não importa de outra, e as regras de interface (a peça do
  catálogo antes do `<div>`, o campo que sai do dado, os quatro finais e o
  desfazer). A auditoria de tela do MCP, o `audit_screen`, dá nota a uma tela
  pronta.

## Testes e CI

Um teste por funcionalidade, começando pelo schema, que é onde mora a regra:

```ts
test('recusa o CNPJ com dígito errado', () => {
  const result = invoiceSchema.safeParse({
    customer: 'Clínica São Lucas',
    document: '11.222.333/0001-80',
    amount: 128_000,
  })

  expect(result.success).toBe(false)
})
```

E a CI roda tipos, testes e build em todo push, para a `main` nunca receber o
que não compila.
