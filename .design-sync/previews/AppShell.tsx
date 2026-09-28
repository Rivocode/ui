import {
  AppShell,
  Badge,
  Button,
  PageHeader,
  SearchInput,
  SidebarBrand,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@rivocode/ui'
import { FileText, Home, Settings, Users, Waves } from 'lucide-react'

const NAVIGATION = (
  <>
    <SidebarHeader>
      <SidebarBrand mark={<Waves size={18} className="text-accent-text" />}>RivoCode</SidebarBrand>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup label="Operação">
        <SidebarMenu>
          <SidebarMenuItem href="#" icon={<Home size={16} />}>
            Painel
          </SidebarMenuItem>
          <SidebarMenuItem
            href="#"
            icon={<FileText size={16} />}
            active
            badge={<Badge size="sm">4</Badge>}
          >
            Notas fiscais
          </SidebarMenuItem>
          <SidebarMenuItem href="#" icon={<Users size={16} />}>
            Clientes
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem href="#" icon={<Settings size={16} />}>
          Preferências
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </>
)

/** Aplicação completa */
export function Complete() {
  return (
    <div className="h-[32rem] overflow-hidden rounded-lg border border-border">
      <AppShell
        contained
        container="md"
        sidebar={NAVIGATION}
        header={
          <>
            <SearchInput placeholder="Buscar notas" className="max-w-xs" />
            <Button size="sm" className="ml-auto">
              Nova nota
            </Button>
          </>
        }
        footer="RivoCode · Emissão de notas fiscais"
      >
        <PageHeader
          titleAs="h2"
          title="Notas fiscais"
          description="As notas emitidas neste mês, da mais nova para a mais antiga."
        />
        <p className="mt-6 text-sm text-fg-muted">
          Tab a partir do topo da página: o primeiro foco é o link “Pular para o conteúdo”.
        </p>
      </AppShell>
    </div>
  )
}

/** Com coluna ao lado */
export function WithAside() {
  return (
    <div className="h-[28rem] overflow-hidden rounded-lg border border-border">
      <AppShell
        contained
        container
        header={<span className="font-display text-lg text-fg">RivoCode</span>}
        aside={
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-fg">Resumo do mês</p>
            <p className="text-fg-muted">42 notas emitidas, 3 canceladas.</p>
          </div>
        }
        labels={{ aside: 'Resumo do mês' }}
      >
        <PageHeader titleAs="h2" title="Painel" description="O que aconteceu hoje na conta." />
      </AppShell>
    </div>
  )
}
