import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Sidebar,
  SidebarBrand,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuRow,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarProvider,
  SidebarTrigger,
} from "../src/components/sidebar";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

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

test("open, the bar shows the name of each destination", () => {
  sidebar(true);

  expect(screen.getByText("Painel")).toBeDefined();
  expect(screen.getByText("Cadastros")).toBeDefined();
  // An open submenu already leaves the child reachable, without another click.
  expect(screen.getByText("Clientes")).toBeDefined();
});

test("collapsed, the search field becomes a button, because 3.5rem does not fit text", () => {
  const { container } = sidebar(false);

  expect(container.querySelector("input[type=search]")).toBeNull();
  expect(screen.getByRole("button", { name: "Buscar" })).toBeDefined();
});

test("collapsed, the submenu becomes a side menu instead of disappearing", () => {
  sidebar(false);

  // The list leaves the bar, otherwise it would indent inside 3.5rem.
  expect(screen.queryByText("Clientes")).toBeNull();

  // And the parent stays reachable, now as a menu trigger.
  const trigger = screen.getByRole("button", { name: "Cadastros" });
  fireEvent.click(trigger);

  expect(screen.getByRole("menuitem", { name: "Clientes" })).toBeDefined();
});

test("on desktop the trigger collapses and expands the bar, and says which one in the name and in aria", () => {
  sidebar(true);

  const trigger = screen.getByRole("button", { name: "Recolher barra lateral" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.queryByRole("button", { name: "Fechar menu" })).toBeNull();

  fireEvent.click(trigger);
  expect(
    screen.getByRole("button", { name: "Expandir barra lateral" }).getAttribute("aria-expanded"),
  ).toBe("false");
});

test("a loose item in the footer does not become an li outside a list, and the one inside the menu gets no marker", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem href="#painel">Painel</SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenuItem href="#preferencias">Preferências</SidebarMenuItem>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );

  const loose = screen.getByRole("link", { name: "Preferências" });
  expect(loose.closest("li") === null).toBe(true);
  expect(loose.parentElement!.tagName).not.toBe("UL");

  for (const li of container.querySelectorAll("li")) {
    expect(li.parentElement!.tagName).toBe("UL");
    expect((li.getAttribute("class") ?? "").split(" ")).toContain("list-none");
  }
  expect(container.querySelectorAll("li").length).toBeGreaterThan(0);
});

test("the placeholder says it is loading, and does not fake a list", () => {
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
 * Mobile
 *
 * The test environment answers `false` to every media query, so the mobile
 * path was never exercised: the two bugs it had, opening by itself on load and
 * still covering the page after picking an item, went straight through the
 * suite.
 * ------------------------------------------------------------------------- */

/** Makes the mobile breakpoint answer true while the test runs. */
function onMobile<T>(run: () => T): T {
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

test("on mobile the bar starts closed, even with defaultOpen", () => {
  onMobile(() => {
    sidebar(true);
    // `defaultOpen` is about the desktop column. On mobile the bar covers the
    // screen, and opening by itself hides exactly what the person came to see.
    expect(screen.queryByText("Painel")).toBeNull();
  });
});

test("on mobile the trigger opens the sheet", () => {
  onMobile(() => {
    sidebar(true);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByText("Painel")).toBeDefined();
  });
});

test("on mobile, picking a destination closes the sheet", () => {
  onMobile(() => {
    sidebar(true);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    fireEvent.click(screen.getByText("Painel"));
    // On desktop it would stay open: there the bar covers nothing.
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

test("collapsed, the group label disappears instead of being clipped", () => {
  // In 3.5rem "CATALOGO" would become "CATA". Disappearing says less; lying
  // about the group name says something wrong.
  const { container } = sidebarWithGroup(false);

  expect(screen.queryByText("Catalogo")).toBeNull();
  // The destination is still there: collapsed, it is only the icon, with the name in the tooltip.
  expect(container.querySelector('a[href="#pecas"]')).not.toBeNull();
});

test("open, the group label shows", () => {
  sidebarWithGroup(true);

  expect(screen.getByText("Catalogo")).toBeDefined();
});

/* ---------------------------------------------------------------------------
 * The name of each destination with the bar collapsed
 *
 * With the bar collapsed, the label leaves the screen and the `<a>` is left
 * with only the icon. An interaction suite measured the browser's
 * accessibility tree and found twelve links with no name at all - in the state
 * that is the default of every operations screen. The screen reader announces
 * "link" twelve times in a row.
 *
 * What these tests do not reach: happy-dom does not compute the browser's
 * accessibility tree. `getByRole(..., { name })` here uses the
 * dom-accessibility-api computation, which reads `aria-label` and the children's
 * text - enough to prove the name exists in the DOM, and not to prove how each
 * engine announces it.
 * ------------------------------------------------------------------------- */

test("collapsed, the destination still has a name, and does not become a mute link", () => {
  sidebar(false);

  expect(screen.getByRole("link", { name: "Painel" })).toBeDefined();
});

test("collapsed, a destination with structured children also has a name", () => {
  // Not every item arrives as plain text: whoever builds the bar often passes a
  // `<span>` with markup inside, and then there is no string to become `aria-label`.
  render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={false}>
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem href="#feedback">
              <span>Feedback</span>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );

  expect(screen.getByRole("link", { name: "Feedback" })).toBeDefined();
});

test("collapsed, the footer menu takes the track width, and the row does not shrink down to the icon", () => {
  render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={false}>
        <Sidebar>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem href="#ajustes">Ajustes</SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );

  const link = screen.getByRole("link", { name: "Ajustes" });
  const footer = link.closest("ul")!.parentElement!;
  expect(footer.className.split(" ")).toContain("items-center");
  expect(link.closest("ul")!.className.split(" ")).toContain("self-stretch");
  expect(link.className.split(" ")).toContain("w-full");
});

test("open, the name comes from the text in the row, with no repeated label", () => {
  // Wide, the text is visible and an `aria-label` on top would only create a
  // second source of truth for the same name.
  sidebar(true);

  const link = screen.getByRole("link", { name: "Painel" });
  expect(link.getAttribute("aria-label")).toBeNull();
});

test("the row action button has a name, even if the caller forgets to give one", () => {
  // An icon button without a name is a "button" announced by the screen reader,
  // and nothing more. The default does not replace the right name - "Opcoes de
  // Clientes" says more than "Mais opcoes" - but it beats silence, and whoever
  // passes their own still rules.
  withTheme(
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuRow>
              <SidebarMenuItem href="#clientes">Clientes</SidebarMenuItem>
              <SidebarMenuAction />
            </SidebarMenuRow>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );

  expect(screen.getByRole("button", { name: "Mais opções" })).toBeDefined();
});

test("the name written by the caller beats the default", () => {
  withTheme(
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuRow>
              <SidebarMenuItem href="#clientes">Clientes</SidebarMenuItem>
              <SidebarMenuAction aria-label="Opções de Clientes" />
            </SidebarMenuRow>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );

  expect(screen.getByRole("button", { name: "Opções de Clientes" })).toBeDefined();
});

function sidebarWithFooter(defaultOpen: boolean) {
  return render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar>
          <SidebarBrand mark={<span>R</span>}>RivoCode</SidebarBrand>
          <SidebarFooter data-testid="rodape">
            <span>EB</span>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );
}

test("collapsed, the footer centers as the brand already centers", () => {
  // With the brand centered at the top and the footer against the left, the
  // collapsed column looks crooked - the same symptom the SidebarBrand comment
  // describes, only at the other end of the bar.
  sidebarWithFooter(false);

  expect(screen.getByTestId("rodape").className).toContain("items-center");
});

test("open, the footer goes back to aligning left", () => {
  // Always centering would trade one defect for another: with a wide bar, the
  // user block would float in the middle of the column.
  sidebarWithFooter(true);

  expect(screen.getByTestId("rodape").className).not.toContain("items-center");
});

test("a row with an action does not nest one <li> inside another", () => {
  // SidebarMenuRow already is the row's <li>. If the item opens another one
  // inside, the HTML is invalid - and the bill only arrives with SSR: the
  // browser receives the text, fixes it by splitting the two into siblings, and
  // the fixed tree does not match the one React expects on hydration.
  const { container } = withTheme(
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuRow>
              <SidebarMenuItem href="#clientes">Clientes</SidebarMenuItem>
              <SidebarMenuAction aria-label="Opcoes de Clientes" />
            </SidebarMenuRow>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );

  expect(container.querySelector("li li")).toBeNull();
  expect(container.querySelectorAll("li")).toHaveLength(1);
});

test("without the row around it, the item is still its own <li>", () => {
  // The lone item inside the <ul> must keep delivering the <li>, otherwise
  // the list loses the semantics the screen reader counts out loud.
  const { container } = withTheme(
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem href="#painel">Painel</SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );

  expect(container.querySelectorAll("li")).toHaveLength(1);
  expect(container.querySelector("li > a")).not.toBeNull();
});
