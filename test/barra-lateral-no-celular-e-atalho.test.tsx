import { afterEach, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Sidebar, SidebarProvider, SidebarTrigger } from "../src/components/sidebar";
import { Steps } from "../src/components/steps";
import { RivoProvider } from "../src/provider/rivo-provider";

const realMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = realMatchMedia;
});

function phone() {
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
}

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");
const state = (container: HTMLElement) =>
  container.querySelector("[data-rc-sidebar]")!.getAttribute("data-rc-sidebar");

function desk(props: Partial<React.ComponentProps<typeof SidebarProvider>> = {}) {
  return render(
    <RivoProvider scope="local">
      <SidebarProvider {...props}>
        <Sidebar>
          <p>Menu</p>
        </Sidebar>
        <input aria-label="Busca" />
        <div contentEditable suppressContentEditableWarning data-testid="editor">
          texto
        </div>
      </SidebarProvider>
    </RivoProvider>,
  );
}

const press = (target: EventTarget, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {
    key,
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
};

test("Ctrl+B fora de campo abre e fecha a barra", () => {
  const { container } = desk();
  expect(state(container)).toBe("open");
  press(document.body, "b");
  expect(state(container)).toBe("closed");
});

test("Ctrl+B dentro de campo ou de editor nao mexe na barra", () => {
  const { container } = desk();
  press(screen.getByLabelText("Busca"), "b");
  expect(state(container)).toBe("open");
  press(screen.getByTestId("editor"), "b");
  expect(state(container)).toBe("open");
});

test("Ctrl+B que o editor ja tratou nao mexe na barra", () => {
  const { container } = desk();
  const editor = screen.getByTestId("editor");
  const claim = (event: Event) => event.preventDefault();
  document.body.addEventListener("keydown", claim);
  try {
    press(editor.parentElement!, "b");
  } finally {
    document.body.removeEventListener("keydown", claim);
  }
  expect(state(container)).toBe("open");
});

test("o atalho em maiuscula casa com a tecla, com ou sem Shift", () => {
  const { container } = desk({ shortcut: "B" });
  press(document.body, "b");
  expect(state(container)).toBe("closed");
  press(document.body, "B", { shiftKey: true });
  expect(state(container)).toBe("open");
});

test("no celular, a barra controlada aberta na mesa nao abre a folha por cima da tela", () => {
  phone();
  const onOpenChange = mock((open: boolean) => void open);
  const onOpenMobileChange = mock((open: boolean) => void open);
  render(
    <RivoProvider scope="local">
      <SidebarProvider open onOpenChange={onOpenChange} onOpenMobileChange={onOpenMobileChange}>
        <Sidebar title="Navegação">
          <p>Menu</p>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    </RivoProvider>,
  );

  expect(screen.queryByRole("dialog")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /menu|navega|barra/i }));
  expect(screen.getByRole("dialog")).toBeDefined();
  expect(onOpenMobileChange).toHaveBeenLastCalledWith(true);

  act(() => {
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  });
  expect(onOpenMobileChange).toHaveBeenLastCalledWith(false);
  expect(onOpenChange).not.toHaveBeenCalled();
});

test("no celular, a folha controlada por openMobile abre pelo estado de quem usa", () => {
  phone();
  render(
    <RivoProvider scope="local">
      <SidebarProvider open={false} openMobile>
        <Sidebar title="Navegação">
          <p>Menu</p>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );
  expect(screen.getByRole("dialog")).toBeDefined();
});

test("no celular, a barra leva className e atributos para a folha, sem apagar o papel de dialogo", () => {
  phone();
  render(
    <RivoProvider scope="local">
      <SidebarProvider openMobile>
        <Sidebar role="none" data-testid="barra" className="w-80">
          <p>Menu</p>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );

  const dialog = screen.getByRole("dialog");
  expect(tokens(dialog)).toContain("w-80");
  expect(tokens(dialog)).not.toContain("w-[17rem]");
  const inner = screen.getByTestId("barra");
  expect(dialog.contains(inner)).toBe(true);
  expect(inner.getAttribute("role")).toBe("none");
});

test("os passos levam className e aria-label para a linha do celular tambem", () => {
  const { container } = render(
    <Steps
      steps={[
        { id: "a", title: "Dados" },
        { id: "b", title: "Pagamento" },
      ]}
      step={0}
      id="passos"
      aria-label="Andamento do cadastro"
      className="mt-6"
    />,
  );

  const compact = container.firstElementChild!;
  const list = container.querySelector("ol")!;

  expect(tokens(compact)).toContain("mt-6");
  expect(tokens(compact)).toContain("sm:hidden");
  expect(compact.getAttribute("aria-label")).toBe("Andamento do cadastro");
  expect(compact.getAttribute("role")).toBe("group");
  expect(compact.hasAttribute("id")).toBe(false);

  expect(tokens(list)).toContain("mt-6");
  expect(tokens(list)).toContain("hidden");
  expect(tokens(list)).toContain("sm:flex");
  expect(list.getAttribute("id")).toBe("passos");
  expect(list.getAttribute("aria-label")).toBe("Andamento do cadastro");
});

test("os passos com className de display continuam escondendo a forma que nao cabe", () => {
  const { container } = render(
    <Steps steps={[{ id: "a", title: "Dados" }]} step={0} className="flex" />,
  );
  expect(tokens(container.querySelector("ol")!)).toContain("hidden");
  expect(tokens(container.firstElementChild!)).toContain("sm:hidden");
});

test("o data-testid do Steps fica num bloco so, e o getByTestId acha um elemento", () => {
  render(
    <Steps
      data-testid="etapas"
      aria-label="Etapas"
      steps={[
        { id: "a", title: "Dados" },
        { id: "b", title: "Revisao" },
      ]}
      step={0}
    />,
  );

  expect(screen.getAllByTestId("etapas")).toHaveLength(1);
  expect(screen.getAllByRole("group", { name: "Etapas" }).length).toBeGreaterThan(0);
});
