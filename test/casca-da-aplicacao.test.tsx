import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { AppShell, type AppShellProps } from "../src/components/app-shell";
import { SidebarContent, SidebarMenu, SidebarMenuItem } from "../src/components/sidebar";
import { RivoProvider } from "../src/provider/rivo-provider";

const NAV = (
  <SidebarContent>
    <SidebarMenu>
      <SidebarMenuItem href="#painel" active>
        Painel
      </SidebarMenuItem>
      <SidebarMenuItem href="#notas">Notas fiscais</SidebarMenuItem>
    </SidebarMenu>
  </SidebarContent>
);

function shell(props: Partial<AppShellProps> = {}) {
  return render(
    <RivoProvider scope="local">
      <AppShell
        header={<span>RivoCode</span>}
        sidebar={NAV}
        aside={<p>Resumo do mês</p>}
        footer={<p>© RivoCode</p>}
        {...props}
      >
        <h1>Notas fiscais</h1>
      </AppShell>
    </RivoProvider>,
  );
}

function onPhone<T>(run: () => T): T {
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

test("cada regiao sai no landmark certo, uma vez cada", () => {
  shell();
  expect(screen.getAllByRole("banner")).toHaveLength(1);
  expect(screen.getAllByRole("navigation")).toHaveLength(1);
  expect(screen.getAllByRole("main")).toHaveLength(1);
  expect(screen.getAllByRole("complementary")).toHaveLength(1);
  expect(screen.getAllByRole("contentinfo")).toHaveLength(1);

  expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeDefined();
  expect(screen.getByRole("complementary", { name: "Informações complementares" })).toBeDefined();
  expect(screen.getByRole("main").textContent).toContain("Notas fiscais");
});

test("a barra lateral da casa nao vira um segundo complementary", () => {
  const { container } = shell({ aside: undefined });
  expect(screen.queryAllByRole("complementary")).toHaveLength(0);
  const sidebar = container.querySelector("aside")!;
  expect(sidebar.getAttribute("role")).toBe("none");
  expect(sidebar.querySelector("nav")).not.toBeNull();
});

test("o link de pular e o primeiro foco da pagina e leva o foco ao main", () => {
  const { container } = shell();
  const skip = screen.getByRole("link", { name: "Pular para o conteúdo" });
  const focusable = container.querySelectorAll("a[href], button");
  expect(focusable[0]).toBe(skip);

  const main = screen.getByRole("main");
  expect(skip.getAttribute("href")).toBe(`#${main.id}`);
  expect(main.tabIndex).toBe(-1);

  fireEvent.click(skip);
  expect(document.activeElement).toBe(main);
});

test("o link de pular so aparece com foco", () => {
  shell();
  const tokens = screen.getByRole("link", { name: "Pular para o conteúdo" }).className.split(" ");
  expect(tokens).toContain("sr-only");
  expect(tokens).toContain("focus:not-sr-only");
});

test("mainId fixa o alvo do link", () => {
  shell({ mainId: "conteudo" });
  expect(screen.getByRole("main").id).toBe("conteudo");
  expect(screen.getByRole("link", { name: "Pular para o conteúdo" }).getAttribute("href")).toBe(
    "#conteudo",
  );
});

test("o cabecalho gruda no topo e traz o botao da barra quando ha barra", () => {
  shell();
  const banner = screen.getByRole("banner");
  const tokens = banner.className.split(" ");
  expect(tokens).toContain("sticky");
  expect(tokens).toContain("top-0");
  expect(tokens).toContain("z-[var(--rc-z-sticky)]");
  expect(banner.querySelector("button[aria-expanded]")).not.toBeNull();
});

test("sem barra lateral, sem navegacao e sem botao de abrir", () => {
  shell({ sidebar: undefined });
  expect(screen.queryByRole("navigation")).toBeNull();
  expect(screen.queryByRole("button", { name: /menu/ })).toBeNull();
  expect(screen.getByRole("banner").textContent).toContain("RivoCode");
});

test("sem header, sem sidebar, sem aside e sem footer, sobra so o main", () => {
  shell({ header: undefined, sidebar: undefined, aside: undefined, footer: undefined });
  expect(screen.queryByRole("banner")).toBeNull();
  expect(screen.queryByRole("complementary")).toBeNull();
  expect(screen.queryByRole("contentinfo")).toBeNull();
  expect(screen.getByRole("main")).toBeDefined();
});

test("container poe o conteudo num Container da casa, e sem ele o conteudo encosta", () => {
  const { unmount } = shell({ container: true });
  const inner = screen.getByRole("main").firstElementChild!;
  expect(inner.className.split(" ")).toContain("max-w-6xl");
  unmount();

  shell({ container: "md" });
  expect(screen.getByRole("main").firstElementChild!.className.split(" ")).toContain("max-w-3xl");
});

test("sem container, o filho e filho direto do main", () => {
  shell();
  expect(screen.getByRole("main").firstElementChild!.tagName).toBe("H1");
});

test("contained troca a janela pela caixa do pai, e a altura de quem chama vence", () => {
  const { container, unmount } = shell({ contained: true });
  const tokens = container.querySelector("[data-rc-sidebar]")!.className.split(" ");
  expect(tokens).toContain("h-full");
  expect(tokens).toContain("min-h-0");
  expect(tokens).toContain("overflow-hidden");
  expect(tokens).not.toContain("min-h-dvh");
  unmount();

  const second = shell({ contained: true, className: "h-96" });
  const sized = second.container.querySelector("[data-rc-sidebar]")!.className.split(" ");
  expect(sized).toContain("h-96");
  expect(sized).not.toContain("h-full");
});

test("sem contained, a casca ocupa a janela", () => {
  const { container } = shell();
  const tokens = container.querySelector("[data-rc-sidebar]")!.className.split(" ");
  expect(tokens).toContain("min-h-dvh");
  expect(tokens).not.toContain("overflow-hidden");
});

test("labels troca os textos", () => {
  shell({ labels: { skipLink: "Ir ao conteúdo", navigation: "Menu", aside: "Ajuda" } });
  expect(screen.getByRole("link", { name: "Ir ao conteúdo" })).toBeDefined();
  expect(screen.getByRole("navigation", { name: "Menu" })).toBeDefined();
  expect(screen.getByRole("complementary", { name: "Ajuda" })).toBeDefined();
});

test("no celular a barra vira a folha do Sidebar, fechada, e o botao do cabecalho a abre", () => {
  onPhone(() => {
    shell();
    expect(screen.queryByRole("navigation")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(nav.textContent).toContain("Painel");
    expect(screen.getByRole("dialog")).toBeDefined();
  });
});

test("controlado: open e onOpenChange passam ao SidebarProvider", () => {
  let asked: boolean | undefined;
  const { container } = shell({ open: false, onOpenChange: (next) => (asked = next) });
  expect(container.querySelector("[data-rc-sidebar]")!.getAttribute("data-rc-sidebar")).toBe(
    "closed",
  );
  fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
  expect(asked).toBe(true);
});
