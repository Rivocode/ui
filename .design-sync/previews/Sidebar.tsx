import { Badge, Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@rivocode/ui'

export function TelaDeOperacao() {
  return (
    <div className="h-96 overflow-hidden rounded-lg border border-border">
      <SidebarProvider defaultOpen>
        <Sidebar>
          <SidebarHeader>
            <span className="font-display text-lg text-fg">RivoCode</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup label="Operacao">
              <SidebarMenu>
                <SidebarMenuItem href="#" active>Painel</SidebarMenuItem>
                <SidebarMenuItem href="#" badge={<Badge>4</Badge>}>Notas fiscais</SidebarMenuItem>
                <SidebarMenuItem href="#">Clientes</SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <SidebarTrigger />
            <p className="font-display text-lg text-fg">Notas fiscais</p>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
