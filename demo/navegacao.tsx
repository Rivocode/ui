import { Bell, FileText, LayoutDashboard, Settings, Users } from "lucide-react";
import { createRoot } from "react-dom/client";

import {
  Badge,
  Button,
  Indicator,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
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
  useMobile,
  type RivoTheme,
} from "../src/index";

const ITEMS = [
  { icon: LayoutDashboard, label: "Painel", ativo: true },
  { icon: FileText, label: "Notas fiscais", contagem: 4 },
  { icon: Users, label: "Clientes" },
  { icon: Settings, label: "Ajustes" },
];

function ScreenWithSidebar({ theme, isOpen }: { theme: RivoTheme; isOpen: boolean }) {
  const isMobile = useMobile();

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
                {ITEMS.map(({ icon: Icon, label, ativo, contagem }) => (
                  <SidebarMenuItem
                    key={label}
                    href="#"
                    active={ativo}
                    icon={<Icon size={16} aria-hidden="true" />}
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

            {!isMobile && (
              <NavigationMenu defaultValue={isOpen ? "produtos" : undefined} className="ml-4">
                <NavigationMenuList>
                  <NavigationMenuItem value="produtos">
                    <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <NavigationMenuLink href="#">Emissao de notas</NavigationMenuLink>
                      <NavigationMenuLink href="#">Cobranca</NavigationMenuLink>
                      <NavigationMenuLink href="#">Conciliacao</NavigationMenuLink>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem value="empresa">
                    <NavigationMenuTrigger>Empresa</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <NavigationMenuLink href="#">Sobre</NavigationMenuLink>
                      <NavigationMenuLink href="#">Contato</NavigationMenuLink>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>

                <NavigationMenuViewport />
              </NavigationMenu>
            )}

            <div className="ml-auto flex items-center gap-4">
              <Indicator count={7} label="7 avisos nao lidos">
                <Button variant="ghost" size="icon" aria-label="Avisos">
                  <Bell size={18} aria-hidden="true" />
                </Button>
              </Indicator>

              <Indicator dot label="Ha algo novo nos ajustes">
                <Button variant="ghost" size="icon" aria-label="Ajustes">
                  <Settings size={18} aria-hidden="true" />
                </Button>
              </Indicator>
            </div>
          </header>

          <div className="min-h-72 p-6">
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
