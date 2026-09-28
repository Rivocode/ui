import { afterEach, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../src/components/sidebar";
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

test("Ctrl+B outside a field opens and closes the bar", () => {
  const { container } = desk();
  expect(state(container)).toBe("open");
  press(document.body, "b");
  expect(state(container)).toBe("closed");
});

test("Ctrl+B inside a field or editor does not touch the bar", () => {
  const { container } = desk();
  press(screen.getByLabelText("Busca"), "b");
  expect(state(container)).toBe("open");
  press(screen.getByTestId("editor"), "b");
  expect(state(container)).toBe("open");
});

test("Ctrl+B the editor already handled does not touch the bar", () => {
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

test("an uppercase shortcut matches the key, with or without Shift", () => {
  const { container } = desk({ shortcut: "B" });
  press(document.body, "b");
  expect(state(container)).toBe("closed");
  press(document.body, "B", { shiftKey: true });
  expect(state(container)).toBe("open");
});

test("on mobile, a controlled bar open on desktop does not open the sheet over the screen", () => {
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

test("on mobile, the sheet controlled by openMobile opens from the consumer's state", () => {
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

test("on mobile, the bar carries className and attributes to the sheet, without erasing the dialog role", () => {
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

test("the steps carry className and aria-label to the mobile row too", () => {
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

test("steps with a display className still hide the form that does not fit", () => {
  const { container } = render(
    <Steps steps={[{ id: "a", title: "Dados" }]} step={0} className="flex" />,
  );
  expect(tokens(container.querySelector("ol")!)).toContain("hidden");
  expect(tokens(container.firstElementChild!)).toContain("sm:hidden");
});

test("the Steps data-testid stays on a single block, and getByTestId finds one element", () => {
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

test("the step title has the line height of the circle, and sits in its middle without a description", () => {
  render(<Steps steps={[{ id: "a", title: "O que é" }]} step={0} />);
  const title = screen
    .getAllByText("O que é")
    .find((node) => node.getAttribute("title") === "O que é")!;

  expect(title.className.split(" ")).toContain("leading-6");
});

test("the sidebar item accepts the router link through render, with the house styling and aria-current", () => {
  let clicked = 0;
  render(
    <SidebarProvider>
      <SidebarMenu>
        <SidebarMenuItem
          active
          render={<a href="/notas" data-router="sim" />}
          onClick={(event) => {
            event.preventDefault();
            clicked += 1;
          }}
        >
          Notas fiscais
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarProvider>,
  );
  const link = screen.getByRole("link", { name: "Notas fiscais" });

  expect(link.getAttribute("data-router")).toBe("sim");
  expect(link.getAttribute("href")).toBe("/notas");
  expect(link.getAttribute("aria-current")).toBe("page");
  expect(link.className.split(" ")).toContain("rounded-md");
  fireEvent.click(link);
  expect(clicked).toBe(1);
});
