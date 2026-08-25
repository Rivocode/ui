import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarProvider,
  SidebarTrigger,
} from "../src/components/sidebar";

function barra(defaultOpen: boolean) {
  return render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar>
          <SidebarInput placeholder="Buscar" />
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem href="#painel" active>
                Painel
              </SidebarMenuItem>
              <SidebarMenuSub label="Cadastros" defaultOpen>
                <SidebarMenuItem href="#clientes">Clientes</SidebarMenuItem>
              </SidebarMenuSub>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    </RivoProvider>,
  );
}

test("aberta, a barra mostra o nome de cada destino", () => {
  barra(true);

  expect(screen.getByText("Painel")).toBeDefined();
  expect(screen.getByText("Cadastros")).toBeDefined();
  // O submenu aberto ja deixa o filho alcancavel, sem mais um clique.
  expect(screen.getByText("Clientes")).toBeDefined();
});

test("encolhida, o campo de busca vira botao, porque 3,5rem nao aceitam texto", () => {
  const { container } = barra(false);

  expect(container.querySelector("input[type=search]")).toBeNull();
  expect(screen.getByRole("button", { name: "Buscar" })).toBeDefined();
});

test("encolhida, o submenu vira menu ao lado em vez de sumir", () => {
  barra(false);

  // A lista some da barra, senao ela indentaria dentro de 3,5rem.
  expect(screen.queryByText("Clientes")).toBeNull();

  // E o pai continua alcancavel, agora como gatilho de menu.
  const gatilho = screen.getByRole("button", { name: "Cadastros" });
  fireEvent.click(gatilho);

  expect(screen.getByRole("menuitem", { name: "Clientes" })).toBeDefined();
});

test("o gatilho abre e fecha, e diz qual dos dois no aria", () => {
  barra(true);

  const gatilho = screen.getByRole("button", { name: "Fechar menu" });
  expect(gatilho.getAttribute("aria-expanded")).toBe("true");

  fireEvent.click(gatilho);
  expect(screen.getByRole("button", { name: "Abrir menu" }).getAttribute("aria-expanded")).toBe(
    "false",
  );
});

test("a marca de lugar avisa que esta carregando, e nao finge uma lista", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen>
        <Sidebar>
          <SidebarMenuSkeleton count={4} />
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );

  const list = container.querySelector("[aria-busy=true]");
  expect(list).not.toBeNull();
  expect(list!.querySelectorAll("li").length).toBe(4);
});
