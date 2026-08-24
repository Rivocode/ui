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

const ITENS = [
  { icone: LayoutDashboard, rotulo: "Painel", ativo: true },
  { icone: FileText, rotulo: "Notas fiscais", contagem: 4 },
  { icone: Users, rotulo: "Clientes" },
  { icone: Settings, rotulo: "Ajustes" },
];

function TelaComBarra({ theme, aberta }: { theme: RivoTheme; aberta: boolean }) {
  return (
    <RivoProvider scope="local" theme={theme}>
      <SidebarProvider defaultOpen={aberta}>
        <Sidebar>
          <SidebarHeader>
            <span className="font-display text-lg text-fg">RivoCode</span>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup label="Operacao">
              <SidebarMenu>
                {ITENS.map(({ icone: Icone, rotulo, ativo, contagem }) => (
                  <SidebarMenuItem
                    key={rotulo}
                    href="#"
                    active={ativo}
                    icon={<Icone size={16} aria-hidden="true" />}
                    badge={contagem ? <Badge>{contagem}</Badge> : undefined}
                  >
                    {rotulo}
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
              {aberta ? "Barra aberta" : "Barra encolhida ate a coluna de icones"}
            </p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <TelaComBarra theme="rivocode-dark" aberta />
    <TelaComBarra theme="rivocode-light" aberta={false} />
  </div>,
);
