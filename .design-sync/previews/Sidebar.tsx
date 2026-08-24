import {
  Badge,
  Sidebar,
  SidebarBrand,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@rivocode/ui'
import { FileText, Home, Settings, Users, Waves } from 'lucide-react'

/** Tela de operação */
export function OperationScreen() {
  return (
    <div className="h-[26rem] overflow-hidden rounded-lg border border-border">
      <SidebarProvider defaultOpen>
        <Sidebar className="h-full">
          <SidebarHeader>
            <SidebarBrand mark={<Waves size={18} className="text-accent" />}>RivoCode</SidebarBrand>
          </SidebarHeader>

          <SidebarInput placeholder="Buscar" />

          <SidebarContent>
            <SidebarGroup label="Operação">
              <SidebarMenu>
                <SidebarMenuItem href="#" icon={<Home size={16} />} active>
                  Painel
                </SidebarMenuItem>
                <SidebarMenuItem
                  href="#"
                  icon={<FileText size={16} />}
                  badge={<Badge size="sm">4</Badge>}
                >
                  Notas fiscais
                </SidebarMenuItem>

                <SidebarMenuSub label="Cadastros" icon={<Users size={16} />} defaultOpen>
                  <SidebarMenuItem href="#">Clientes</SidebarMenuItem>
                  <SidebarMenuItem href="#">Fornecedores</SidebarMenuItem>
                  <SidebarMenuItem href="#">Produtos</SidebarMenuItem>
                </SidebarMenuSub>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup label="Ajustes">
              <SidebarMenu>
                <SidebarMenuItem href="#" icon={<Settings size={16} />}>
                  Preferências
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenuItem href="#">Sair</SidebarMenuItem>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <SidebarTrigger />
            <p className="font-display text-lg text-fg">Notas fiscais</p>
          </header>
          <div className="p-4 text-sm text-fg-muted">
            Feche a barra pelo botão, ou por Ctrl+B, e ela encolhe até a coluna de ícones. O submenu
            vira menu ao lado, em vez de sumir.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

/** Carregando a navegação */
export function LoadingNavigation() {
  return (
    <div className="h-64 overflow-hidden rounded-lg border border-border">
      <SidebarProvider defaultOpen>
        <Sidebar className="h-full">
          <SidebarHeader>
            <SidebarBrand mark={<Waves size={18} className="text-accent" />}>RivoCode</SidebarBrand>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenuSkeleton count={5} />
          </SidebarContent>
        </Sidebar>
        <SidebarInset />
      </SidebarProvider>
    </div>
  )
}
