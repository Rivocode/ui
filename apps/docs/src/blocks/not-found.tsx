import { Button, Heading, Link, SearchInput, Text } from '@rivocode/ui'
import { ArrowLeft, Compass, House } from 'lucide-react'

const SHORTCUTS = [
  { href: '/notas', label: 'Notas fiscais' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/ajuda', label: 'Central de ajuda' },
]

export default function NotFoundPage() {
  return (
    <div className="flex w-full justify-center bg-bg px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted">
            <Compass size={24} aria-hidden="true" />
          </div>
          <Text size="sm" tone="subtle" className="font-mono">
            Erro 404
          </Text>
          <Heading level={1} size="2xl">
            Não achamos esta página
          </Heading>
          <Text tone="muted">
            O endereço pode ter mudado, ou o link que trouxe você até aqui veio incompleto. Busque o
            que procurava ou volte para o início.
          </Text>
        </div>

        <form role="search" action="/busca" className="flex flex-col gap-2 sm:flex-row">
          <SearchInput
            name="q"
            aria-label="Buscar em todo o sistema"
            placeholder="Nota, cliente ou CNPJ"
            className="min-w-0 flex-1"
          />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button render={<a href="/" />}>
            <House size={16} aria-hidden="true" />
            Ir para o início
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar à página anterior
          </Button>
        </div>

        <nav aria-labelledby="atalhos-404" className="space-y-2 border-t border-border pt-6">
          <Text size="sm" tone="subtle" id="atalhos-404">
            Os lugares mais procurados
          </Text>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.href}>
                <Link href={shortcut.href} className="text-sm">
                  {shortcut.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
