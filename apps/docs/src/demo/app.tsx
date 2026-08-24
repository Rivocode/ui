import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Command,
  Kbd,
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  RivoProvider,
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
  SidebarMenuSub,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  type CommandGroup,
  type RivoDensity,
  type RivoTheme,
} from '@rivocode/ui'
import {
  Building2,
  FileText,
  Home,
  LogOut,
  Moon,
  Plus,
  Settings as SettingsIcon,
  Sun,
  Users,
  Waves,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Customers } from '@/demo/customers'
import { Dashboard } from '@/demo/dashboard'
import { Invoices } from '@/demo/invoices'
import { NewInvoice } from '@/demo/new-invoice'
import { Settings } from '@/demo/settings'

/* ---------------------------------------------------------------------------
 * The demo application
 *
 * Not a grid of components: an application. Sidebar that collapses, command
 * palette on Ctrl+K, a dashboard with real charts, a listing with filters and
 * a details sheet, a four-step form, and settings that change the theme and
 * the density of everything above.
 *
 * A card grid answers "does this component exist". Only a screen answers the
 * question someone actually has, which is whether the pieces hold together
 * when they are all on at once.
 * ------------------------------------------------------------------------- */

type ScreenId = 'dashboard' | 'invoices' | 'new' | 'customers' | 'settings'

const TITLES: Record<ScreenId, string> = {
  dashboard: 'Painel',
  invoices: 'Notas fiscais',
  new: 'Nova nota',
  customers: 'Clientes',
  settings: 'Ajustes',
}

export function DemoApp() {
  const [screen, setScreen] = useState<ScreenId>('dashboard')
  const [theme, setTheme] = useState<RivoTheme>('rivocode-dark')
  const [density, setDensity] = useState<RivoDensity>('comfortable')
  const [palette, setPalette] = useState(false)

  const commands: CommandGroup[] = useMemo(
    () => [
      {
        label: 'Ir para',
        items: [
          {
            id: 'dashboard',
            label: 'Painel',
            icon: <Home size={16} />,
            keywords: 'inicio home dashboard',
            onSelect: () => setScreen('dashboard'),
          },
          {
            id: 'invoices',
            label: 'Notas fiscais',
            icon: <FileText size={16} />,
            keywords: 'nf fatura boleto listagem',
            onSelect: () => setScreen('invoices'),
          },
          {
            id: 'customers',
            label: 'Clientes',
            icon: <Users size={16} />,
            keywords: 'cadastro',
            onSelect: () => setScreen('customers'),
          },
          {
            id: 'settings',
            label: 'Ajustes',
            icon: <SettingsIcon size={16} />,
            keywords: 'preferencias tema densidade',
            onSelect: () => setScreen('settings'),
          },
        ],
      },
      {
        label: 'Criar',
        items: [
          {
            id: 'new',
            label: 'Nova nota fiscal',
            description: 'Abre o formulário em branco',
            icon: <Plus size={16} />,
            shortcut: 'mod+n',
            onSelect: () => setScreen('new'),
          },
        ],
      },
      {
        label: 'Aparência',
        items: [
          {
            id: 'theme',
            label: theme === 'rivocode-dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro',
            icon: theme === 'rivocode-dark' ? <Sun size={16} /> : <Moon size={16} />,
            keywords: 'tema cor escuro claro',
            onSelect: () =>
              setTheme(theme === 'rivocode-dark' ? 'rivocode-light' : 'rivocode-dark'),
          },
          {
            id: 'density',
            label: density === 'compact' ? 'Densidade confortável' : 'Densidade compacta',
            keywords: 'altura linhas espaco',
            onSelect: () => setDensity(density === 'compact' ? 'comfortable' : 'compact'),
          },
        ],
      },
    ],
    [theme, density],
  )

  return (
    <RivoProvider scope="local" theme={theme} density={density}>
      {/* Sem moldura e sem altura fixa: a demonstracao e uma pagina, e nao a
          foto de uma. Um sistema dentro de um cartao com cantos arredondados
          continua parecendo exemplo; ocupando a tela ele passa a ser o sistema,
          que e a pergunta que quem chega esta fazendo. */}
      <div className="border-t border-border">
        <SidebarProvider defaultOpen className="min-h-0">
          <Sidebar className="h-[calc(100dvh-3.5rem)]">
            <SidebarHeader>
              <SidebarBrand mark={<Waves size={18} className="text-accent" />}>
                RivoCode
              </SidebarBrand>
            </SidebarHeader>

            <SidebarInput placeholder="Buscar" onFocus={() => setPalette(true)} />

            <SidebarContent>
              <SidebarGroup label="Operação">
                <SidebarMenu>
                  <SidebarMenuItem
                    href="#"
                    icon={<Home size={16} />}
                    active={screen === 'dashboard'}
                    onClick={(event) => {
                      event.preventDefault()
                      setScreen('dashboard')
                    }}
                  >
                    Painel
                  </SidebarMenuItem>

                  <SidebarMenuItem
                    href="#"
                    icon={<FileText size={16} />}
                    active={screen === 'invoices'}
                    badge={<Badge size="sm">6</Badge>}
                    onClick={(event) => {
                      event.preventDefault()
                      setScreen('invoices')
                    }}
                  >
                    Notas fiscais
                  </SidebarMenuItem>

                  <SidebarMenuSub
                    label="Cadastros"
                    icon={<Building2 size={16} />}
                    active={screen === 'customers'}
                    defaultOpen
                  >
                    <SidebarMenuItem
                      href="#"
                      active={screen === 'customers'}
                      onClick={(event) => {
                        event.preventDefault()
                        setScreen('customers')
                      }}
                    >
                      Clientes
                    </SidebarMenuItem>
                    <SidebarMenuItem href="#">Fornecedores</SidebarMenuItem>
                    <SidebarMenuItem href="#">Produtos</SidebarMenuItem>
                  </SidebarMenuSub>
                </SidebarMenu>
              </SidebarGroup>

              <SidebarSeparator />

              <SidebarGroup label="Sistema">
                <SidebarMenu>
                  <SidebarMenuItem
                    href="#"
                    icon={<SettingsIcon size={16} />}
                    active={screen === 'settings'}
                    onClick={(event) => {
                      event.preventDefault()
                      setScreen('settings')
                    }}
                  >
                    Ajustes
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenuItem href="#" icon={<LogOut size={16} />}>
                Sair
              </SidebarMenuItem>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="h-[calc(100dvh-3.5rem)] overflow-y-auto bg-bg">
            <header className="sticky top-0 z-[var(--rc-z-sticky)] flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-md">
              <SidebarTrigger />

              <Breadcrumb
                items={[
                  { label: 'RivoCode', href: '#' },
                  { label: TITLES[screen] },
                ]}
                className="min-w-0"
              />

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPalette(true)}
                  className="max-sm:hidden"
                >
                  Buscar
                  <Kbd size="sm" keys="mod+k" />
                </Button>

                <Button size="sm" onClick={() => setScreen('new')}>
                  <Plus size={16} />
                  <span className="max-sm:hidden">Nova nota</span>
                </Button>

                <Menu>
                  <MenuTrigger render={<button type="button" aria-label="Sua conta" />}>
                    <Avatar size="sm" fallback="EB" />
                  </MenuTrigger>
                  <MenuContent>
                    <MenuGroup label="Emanuel Bacalhau">
                      <MenuItem onClick={() => setScreen('settings')}>Ajustes</MenuItem>
                      <MenuItem
                        onClick={() =>
                          setTheme(theme === 'rivocode-dark' ? 'rivocode-light' : 'rivocode-dark')
                        }
                      >
                        {theme === 'rivocode-dark' ? 'Tema claro' : 'Tema escuro'}
                      </MenuItem>
                    </MenuGroup>
                    <MenuSeparator />
                    <MenuItem tone="danger">Sair</MenuItem>
                  </MenuContent>
                </Menu>
              </div>
            </header>

            <div className="p-4 sm:p-6">
              {screen === 'dashboard' && <Dashboard />}
              {screen === 'invoices' && <Invoices />}
              {screen === 'new' && <NewInvoice />}
              {screen === 'settings' && (
                <Settings
                  theme={theme}
                  onTheme={setTheme}
                  density={density}
                  onDensity={setDensity}
                />
              )}
              {screen === 'customers' && <Customers onOpenInvoices={() => setScreen('invoices')} />}
            </div>
          </SidebarInset>
        </SidebarProvider>

        <Command open={palette} onOpenChange={setPalette} groups={commands} />
      </div>
    </RivoProvider>
  )
}
