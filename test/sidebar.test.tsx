import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarProvider,
  SidebarTrigger,
} from "../src/components/sidebar";

function sidebar(defaultOpen: boolean) {
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
  sidebar(true);

  expect(screen.getByText("Painel")).toBeDefined();
  expect(screen.getByText("Cadastros")).toBeDefined();
  // O submenu aberto ja deixa o filho alcancavel, sem mais um clique.
  expect(screen.getByText("Clientes")).toBeDefined();
});

test("encolhida, o campo de busca vira botao, porque 3,5rem nao aceitam texto", () => {
  const { container } = sidebar(false);

  expect(container.querySelector("input[type=search]")).toBeNull();
  expect(screen.getByRole("button", { name: "Buscar" })).toBeDefined();
});

test("encolhida, o submenu vira menu ao lado em vez de sumir", () => {
  sidebar(false);

  // A lista some da barra, senao ela indentaria dentro de 3,5rem.
  expect(screen.queryByText("Clientes")).toBeNull();

  // E o pai continua alcancavel, agora como gatilho de menu.
  const trigger = screen.getByRole("button", { name: "Cadastros" });
  fireEvent.click(trigger);

  expect(screen.getByRole("menuitem", { name: "Clientes" })).toBeDefined();
});

test("o gatilho abre e fecha, e diz qual dos dois no aria", () => {
  sidebar(true);

  const trigger = screen.getByRole("button", { name: "Fechar menu" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");

  fireEvent.click(trigger);
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

/* ---------------------------------------------------------------------------
 * Celular
 *
 * O ambiente de teste responde `false` para toda media query, entao o caminho
 * do celular nunca era exercitado: os dois bugs que ele teve, abrir sozinha ao
 * carregar e continuar cobrindo a pagina depois de escolher um item, passaram
 * inteiros pela suite.
 * ------------------------------------------------------------------------- */

/** Faz o corte de celular responder verdadeiro enquanto o teste roda. */
function comCelular<T>(run: () => T): T {
  const real = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width: 639px"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
      onchange: null,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    return run();
  } finally {
    window.matchMedia = real;
  }
}

test("no celular a barra comeca fechada, mesmo com defaultOpen", () => {
  comCelular(() => {
    sidebar(true);
    // `defaultOpen` fala da coluna da mesa. No celular a barra cobre a tela, e
    // abrir sozinha tapa justamente o que a pessoa veio ver.
    expect(screen.queryByText("Painel")).toBeNull();
  });
});

test("no celular o gatilho abre a folha", () => {
  comCelular(() => {
    sidebar(true);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByText("Painel")).toBeDefined();
  });
});

test("no celular, escolher um destino fecha a folha", () => {
  comCelular(() => {
    sidebar(true);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    fireEvent.click(screen.getByText("Painel"));
    // Na mesa ela continuaria aberta: ali a barra nao cobre nada.
    expect(screen.queryByText("Painel")).toBeNull();
  });
});

function sidebarWithGroup(defaultOpen: boolean) {
  return render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup label="Catalogo">
              <SidebarMenu>
                <SidebarMenuItem href="#pecas">Pecas</SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );
}

test("encolhida, o rotulo do grupo some em vez de sair cortado", () => {
  // Em 3,5rem "CATALOGO" viraria "CATA". Sumir diz menos; mentir sobre o nome
  // do grupo diz errado.
  const { container } = sidebarWithGroup(false);

  expect(screen.queryByText("Catalogo")).toBeNull();
  // O destino continua la: encolhida, ele e so o icone, com o nome no tooltip.
  expect(container.querySelector('a[href="#pecas"]')).not.toBeNull();
});

test("aberta, o rotulo do grupo aparece", () => {
  sidebarWithGroup(true);

  expect(screen.getByText("Catalogo")).toBeDefined();
});
