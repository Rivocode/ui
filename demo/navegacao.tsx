import { FileText, LayoutDashboard, Settings, Users } from "lucide-react";
import { createRoot } from "react-dom/client";

import {
  Badge,
  RivoProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  type RivoTheme,
} from "../src/index";

const ITEMS = [
  { icone: LayoutDashboard, label: "Painel", ativo: true },
  { icone: FileText, label: "Notas fiscais", contagem: 4 },
  { icone: Users, label: "Clientes" },
  { icone: Settings, label: "Ajustes" },
];

function ScreenWithSidebar({ theme, isOpen }: { theme: RivoTheme; isOpen: boolean }) {
  return (
    <RivoProvider scope="local" theme={theme}>
      <SidebarProvider defaultOpen={isOpen}>
        <Sidebar>
          <SidebarHeader>
            <span className="font-display text-lg text-fg">RivoCode</span>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup label="Operacao">
              <SidebarMenu>
                {ITEMS.map(({ icone: Icone, label, ativo, contagem }) => (
                  <SidebarMenuItem
                    key={label}
                    href="#"
                    active={ativo}
                    icon={<Icone size={16} aria-hidden="true" />}
                    badge={contagem ? <Badge>{contagem}</Badge> : undefined}
                  >
                    {label}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenuItem href="#" icon={<Settings size={16} aria-hidden="true" />}>
              Ajustes
            </SidebarMenuItem>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <SidebarTrigger />
            <p className="font-display text-lg text-fg">Notas fiscais</p>
          </header>
          <div className="p-6">
            <p className="text-base text-fg-muted">
              {isOpen ? "Barra aberta" : "Barra encolhida ate a coluna de icones"}
            </p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <ScreenWithSidebar theme="rivocode-dark" isOpen />
    <ScreenWithSidebar theme="rivocode-light" isOpen={false} />
  </div>,
);
