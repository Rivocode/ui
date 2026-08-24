import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '@rivocode/ui'

/** Topo de site */
export function SiteHeader() {
  return (
    <div className="min-h-64">
      <NavigationMenu defaultValue="produtos">
        <NavigationMenuList>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#">Emissão de notas</NavigationMenuLink>
              <NavigationMenuLink href="#">Cobranca</NavigationMenuLink>
              <NavigationMenuLink href="#">Conciliação</NavigationMenuLink>
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
    </div>
  )
}
