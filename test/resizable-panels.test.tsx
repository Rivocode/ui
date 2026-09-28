import { expect, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  type ResizablePanelGroupProps,
  type ResizablePanelHandle,
  type ResizableStorage,
} from "../src/components/resizable";
import { Splitter } from "../src/components/splitter";
import { CSS_BOUNDARIES } from "../src/lib/contrast";

function withTheme(node: React.ReactNode, dir: "ltr" | "rtl" = "ltr") {
  return render(
    <RivoProvider scope="local" dir={dir}>
      {node}
    </RivoProvider>,
  );
}

function three(props: Partial<ResizablePanelGroupProps> = {}) {
  const layouts: number[][] = [];
  const view = withTheme(
    <ResizablePanelGroup onLayoutChange={(sizes) => layouts.push(sizes)} {...props}>
      <ResizablePanel id="arvore" defaultSize={20} minSize={10}>
        Árvore
      </ResizablePanel>
      <ResizableHandle aria-label="Entre árvore e editor" />
      <ResizablePanel id="editor" defaultSize={50} minSize={20}>
        Editor
      </ResizablePanel>
      <ResizableHandle aria-label="Entre editor e inspetor" />
      <ResizablePanel id="inspetor" minSize={15}>
        Inspetor
      </ResizablePanel>
    </ResizablePanelGroup>,
  );
  return { ...view, layouts };
}

const flex = (id: string) => document.getElementById(id)!.style.flexGrow;

test("three panels: the one with no size takes what is left, and each divider measures the panel before it", () => {
  three();

  expect(flex("arvore")).toBe("20");
  expect(flex("editor")).toBe("50");
  expect(flex("inspetor")).toBe("30");

  const [first, second] = screen.getAllByRole("separator");
  expect(first!.getAttribute("aria-controls")).toBe("arvore");
  expect(first!.getAttribute("aria-valuenow")).toBe("20");
  expect(first!.getAttribute("aria-valuetext")).toBe("20%");
  expect(second!.getAttribute("aria-controls")).toBe("editor");
  expect(second!.getAttribute("aria-valuenow")).toBe("50");
});

test("the arrow moves only the two neighbors, and the whole layout comes out in onLayoutChange", () => {
  const { layouts } = three();
  const handle = screen.getByRole("separator", { name: "Entre editor e inspetor" });

  fireEvent.keyDown(handle, { key: "ArrowRight" });

  expect(layouts.at(-1)).toEqual([20, 52, 28]);
  expect(handle.getAttribute("aria-valuenow")).toBe("52");
});

test("Home and End go to the extremes the neighbors' sizes allow", () => {
  const { layouts } = three();
  const handle = screen.getByRole("separator", { name: "Entre editor e inspetor" });

  expect(handle.getAttribute("aria-valuemin")).toBe("20");
  expect(handle.getAttribute("aria-valuemax")).toBe("65");

  fireEvent.keyDown(handle, { key: "End" });
  expect(layouts.at(-1)).toEqual([20, 65, 15]);

  fireEvent.keyDown(handle, { key: "Home" });
  expect(layouts.at(-1)).toEqual([20, 20, 60]);
});

test("the arrow stops at the shrinking panel's minimum, and does not push the panel below it", () => {
  const { layouts } = three();
  const handle = screen.getByRole("separator", { name: "Entre árvore e editor" });

  for (let press = 0; press < 10; press++) fireEvent.keyDown(handle, { key: "ArrowLeft" });

  expect(layouts.at(-1)![0]).toBe(10);
  expect(handle.getAttribute("aria-valuenow")).toBe("10");
});

function collapsible() {
  const calls: string[] = [];
  const ref = createRef<ResizablePanelHandle>();
  const view = withTheme(
    <ResizablePanelGroup>
      <ResizablePanel
        ref={ref}
        id="lateral"
        defaultSize={25}
        minSize={20}
        collapsible
        onCollapse={() => calls.push("collapse")}
        onExpand={() => calls.push("expand")}
      >
        <button type="button">Filtro</button>
      </ResizablePanel>
      <ResizableHandle aria-label="Barra lateral" />
      <ResizablePanel id="conteudo">Conteúdo</ResizablePanel>
    </ResizablePanelGroup>,
  );
  return { ...view, calls, ref, handle: screen.getByRole("separator") };
}

test("Enter collapses the collapsible panel, and Enter again restores its previous size", () => {
  const { calls, handle } = collapsible();

  fireEvent.keyDown(handle, { key: "Enter" });

  const panel = document.getElementById("lateral")!;
  expect(flex("lateral")).toBe("0");
  expect(panel.hasAttribute("data-collapsed")).toBe(true);
  expect(panel.hasAttribute("inert")).toBe(true);
  expect(handle.getAttribute("aria-valuenow")).toBe("0");
  expect(calls).toEqual(["collapse"]);

  fireEvent.keyDown(handle, { key: "Enter" });

  expect(flex("lateral")).toBe("25");
  expect(panel.hasAttribute("inert")).toBe(false);
  expect(calls).toEqual(["collapse", "expand"]);
});

test("below the minimum the collapsible panel collapses, and does not stop at a size it does not accept", () => {
  const { handle } = collapsible();

  expect(handle.getAttribute("aria-valuemin")).toBe("0");

  for (let press = 0; press < 3; press++) fireEvent.keyDown(handle, { key: "ArrowLeft" });
  expect(flex("lateral")).toBe("20");

  fireEvent.keyDown(handle, { key: "ArrowLeft" });
  expect(flex("lateral")).toBe("0");

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(flex("lateral")).toBe("20");

  fireEvent.keyDown(handle, { key: "Home" });
  expect(flex("lateral")).toBe("0");
});

test("Enter on a divider without a collapsible neighbor does nothing and does not swallow the key", () => {
  three();
  const handle = screen.getByRole("separator", { name: "Entre árvore e editor" });

  const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
  handle.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(false);
  expect(flex("arvore")).toBe("20");
});

test("the ref API collapses, expands and resizes", () => {
  const { ref, calls } = collapsible();

  act(() => ref.current!.collapse());
  expect(ref.current!.isCollapsed()).toBe(true);
  expect(ref.current!.getSize()).toBe(0);

  act(() => ref.current!.expand());
  expect(ref.current!.getSize()).toBe(25);

  act(() => ref.current!.resize(40));
  expect(flex("lateral")).toBe("40");
  expect(flex("conteudo")).toBe("60");
  expect(calls).toEqual(["collapse", "expand"]);
});

function mockBox(group: HTMLElement) {
  group.getBoundingClientRect = () =>
    ({ left: 0, right: 600, width: 600, top: 0, bottom: 300, height: 300 }) as DOMRect;
}

test("dragging past half the minimum collapses; before half, the panel stops at the minimum", () => {
  const { handle } = collapsible();
  handle.setPointerCapture = () => {};
  mockBox(handle.parentElement!);

  fireEvent.pointerDown(handle, { clientX: 150, pointerId: 1 });
  fireEvent.pointerMove(window, { clientX: 90, pointerId: 1 });
  expect(flex("lateral")).toBe("20");

  fireEvent.pointerMove(window, { clientX: 50, pointerId: 1 });
  expect(flex("lateral")).toBe("0");

  fireEvent.pointerUp(window, { pointerId: 1 });
});

test("in rtl the arrow moves toward the side the person sees, and the drag measures from the reading edge", () => {
  const layouts: number[][] = [];
  const view = withTheme(
    <ResizablePanelGroup onLayoutChange={(sizes) => layouts.push(sizes)}>
      <ResizablePanel defaultSize={50}>Lista</ResizablePanel>
      <ResizableHandle aria-label="Divisória" />
      <ResizablePanel>Detalhe</ResizablePanel>
    </ResizablePanelGroup>,
    "rtl",
  );
  const handle = within(view.container).getByRole("separator");

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(layouts.at(-1)).toEqual([48, 52]);

  handle.setPointerCapture = () => {};
  mockBox(handle.parentElement!);
  fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
  fireEvent.pointerMove(window, { clientX: 360, pointerId: 1 });
  expect(layouts.at(-1)).toEqual([38, 62]);
  fireEvent.pointerUp(window, { pointerId: 1 });
});

test("nested group: the inner divider only moves the inner group", () => {
  const outer: number[][] = [];
  const inner: number[][] = [];
  withTheme(
    <ResizablePanelGroup onLayoutChange={(sizes) => outer.push(sizes)}>
      <ResizablePanel defaultSize={30}>Menu</ResizablePanel>
      <ResizableHandle aria-label="Fora" />
      <ResizablePanel>
        <ResizablePanelGroup orientation="vertical" onLayoutChange={(sizes) => inner.push(sizes)}>
          <ResizablePanel id="codigo" defaultSize={70}>
            Código
          </ResizablePanel>
          <ResizableHandle aria-label="Dentro" />
          <ResizablePanel id="terminal">Terminal</ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>,
  );

  const handle = screen.getByRole("separator", { name: "Dentro" });
  expect(handle.getAttribute("aria-orientation")).toBe("horizontal");
  expect(handle.getAttribute("aria-controls")).toBe("codigo");

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(inner).toEqual([]);

  fireEvent.keyDown(handle, { key: "ArrowDown" });
  expect(inner.at(-1)).toEqual([72, 28]);
  expect(outer).toEqual([]);
  expect(screen.getByRole("separator", { name: "Fora" }).getAttribute("aria-valuenow")).toBe("30");
});

function memory(): ResizableStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => {
      data.set(name, value);
    },
  };
}

test("autoSaveId saves the layout and restores it on the next mount", () => {
  const storage = memory();
  const first = three({ autoSaveId: "editor", storage });

  fireEvent.keyDown(screen.getByRole("separator", { name: "Entre árvore e editor" }), {
    key: "ArrowRight",
  });
  expect(JSON.parse(storage.data.get("rivocode-ui:resizable:editor")!)).toEqual([22, 48, 30]);

  first.unmount();
  three({ autoSaveId: "editor", storage });

  expect(flex("arvore")).toBe("22");
  expect(flex("editor")).toBe("48");
});

test("a saved layout that does not fit today's panels is ignored, and the group goes back to defaultSize", () => {
  const storage = memory();
  storage.data.set("rivocode-ui:resizable:editor", JSON.stringify([50, 50]));
  three({ autoSaveId: "editor", storage });

  expect(flex("arvore")).toBe("20");
});

test("a throwing storage does not crash the screen", () => {
  const broken: ResizableStorage = {
    getItem: () => {
      throw new Error("modo privado");
    },
    setItem: () => {
      throw new Error("cota");
    },
  };

  three({ autoSaveId: "editor", storage: broken });
  fireEvent.keyDown(screen.getByRole("separator", { name: "Entre árvore e editor" }), {
    key: "ArrowRight",
  });

  expect(flex("arvore")).toBe("22");
});

test("the controlled layout rules, and the divider only proposes", () => {
  const layouts: number[][] = [];
  withTheme(
    <ResizablePanelGroup layout={[40, 60]} onLayoutChange={(sizes) => layouts.push(sizes)}>
      <ResizablePanel id="a">A</ResizablePanel>
      <ResizableHandle aria-label="Divisória" />
      <ResizablePanel id="b">B</ResizablePanel>
    </ResizablePanelGroup>,
  );

  fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });

  expect(layouts.at(-1)).toEqual([42, 58]);
  expect(flex("a")).toBe("40");
});

test("the divider target reaches the 24px of WCAG 2.5.8 in both orientations", () => {
  withTheme(
    <ResizablePanelGroup>
      <ResizablePanel>A</ResizablePanel>
      <ResizableHandle aria-label="Deitada" />
      <ResizablePanel>
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel>B</ResizablePanel>
          <ResizableHandle aria-label="Em pé" />
          <ResizablePanel>C</ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>,
  );

  const side = screen.getByRole("separator", { name: "Deitada" }).className.split(" ");
  expect(side).toContain("relative");
  expect(side).toContain("after:-inset-x-3");
  expect(side).not.toContain("after:-inset-y-3");

  const lying = screen.getByRole("separator", { name: "Em pé" }).className.split(" ");
  expect(lying).toContain("after:-inset-y-3");
  expect(lying).not.toContain("after:-inset-x-3");
});

test("the withHandle grip is decoration, hidden from the screen reader and accepts a class", () => {
  withTheme(
    <ResizablePanelGroup>
      <ResizablePanel>A</ResizablePanel>
      <ResizableHandle withHandle aria-label="Divisória" classNames={{ grip: "marca-da-pega" }} />
      <ResizablePanel>B</ResizablePanel>
    </ResizablePanelGroup>,
  );

  const grip = screen.getByRole("separator").firstElementChild!;
  expect(grip.getAttribute("aria-hidden")).toBe("true");
  expect(grip.className.split(" ")).toContain("marca-da-pega");
});

test("a divider without a caller-given name still has one, and aria-labelledby beats the default", () => {
  withTheme(
    <ResizablePanelGroup>
      <ResizablePanel>A</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>B</ResizablePanel>
      <span id="rotulo">Largura do inspetor</span>
      <ResizableHandle aria-labelledby="rotulo" />
      <ResizablePanel>C</ResizablePanel>
    </ResizablePanelGroup>,
  );

  expect(screen.getByRole("separator", { name: "Redimensionar painéis" })).toBeDefined();
  expect(screen.getByRole("separator", { name: "Largura do inspetor" })).toBeDefined();
});

test("panel and divider outside a group mount without breaking, and the loose divider leaves the Tab order", () => {
  withTheme(
    <>
      <ResizablePanel defaultSize={30}>Solto</ResizablePanel>
      <ResizableHandle aria-label="Solta" />
    </>,
  );

  const handle = screen.getByRole("separator");
  expect(handle.hasAttribute("tabindex")).toBe(false);
  expect(handle.hasAttribute("aria-valuenow")).toBe(false);
});

test("a panel that reappears comes back at defaultSize, and the space comes from those already there", () => {
  function Group({ show }: { show: boolean }) {
    return (
      <RivoProvider scope="local">
        <ResizablePanelGroup>
          <ResizablePanel id="lista" defaultSize={20}>
            Lista
          </ResizablePanel>
          <ResizableHandle aria-label="Entre lista e nota" />
          <ResizablePanel id="nota" defaultSize={50}>
            Nota
          </ResizablePanel>
          {show && (
            <>
              <ResizableHandle aria-label="Entre nota e inspetor" />
              <ResizablePanel id="inspetor" defaultSize={30}>
                Inspetor
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </RivoProvider>
    );
  }

  const view = render(<Group show />);
  expect([flex("lista"), flex("nota"), flex("inspetor")]).toEqual(["20", "50", "30"]);

  view.rerender(<Group show={false} />);
  expect([flex("lista"), flex("nota")]).toEqual(["20", "80"]);

  view.rerender(<Group show />);
  expect([flex("lista"), flex("nota"), flex("inspetor")]).toEqual(["20", "50", "30"]);
});

test("the group and Splitter ref reach the root node", () => {
  const group = createRef<HTMLDivElement>();
  const splitter = createRef<HTMLDivElement>();
  withTheme(
    <>
      <ResizablePanelGroup ref={group} data-testid="grupo">
        <ResizablePanel>A</ResizablePanel>
        <ResizableHandle aria-label="Do grupo" />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>
      <Splitter ref={splitter} data-testid="divisor" label="Do divisor" start="C" end="D" />
    </>,
  );

  expect(group.current).toBe(screen.getByTestId("grupo"));
  expect(splitter.current).toBe(screen.getByTestId("divisor"));
});

test("the divider line paints in border-strong, which measures 3:1 on the background, and not in border", () => {
  withTheme(
    <>
      <ResizablePanelGroup>
        <ResizablePanel>A</ResizablePanel>
        <ResizableHandle aria-label="Do grupo" />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>
      <Splitter label="Do divisor" start="C" end="D" />
    </>,
  );

  for (const name of ["Do grupo", "Do divisor"]) {
    const tokens = screen.getByRole("separator", { name }).className.split(" ");
    expect(tokens).toContain("bg-border-strong");
    expect(tokens).not.toContain("bg-border");
  }

  const measured = CSS_BOUNDARIES.filter(([front]) => front === "--rc-border-strong").map(
    ([, over]) => over,
  );
  expect(measured).toContain("--rc-bg");
  expect(measured).toContain("--rc-surface");
});

test("with the end panel collapsed, the divider moves away from the edge so the grip and the ring fit", () => {
  function Edge({ vertical = false }: { vertical?: boolean }) {
    return (
      <ResizablePanelGroup orientation={vertical ? "vertical" : "horizontal"}>
        <ResizablePanel id={vertical ? "topo" : "inicio"} defaultSize={25} collapsible>
          A
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={vertical ? "Deitada" : "Em pé"} />
        <ResizablePanel defaultSize={50}>B</ResizablePanel>
        <ResizableHandle aria-label={vertical ? "Deitada do fim" : "Em pé do fim"} />
        <ResizablePanel id={vertical ? "base" : "fim"} defaultSize={25} collapsible>
          C
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }
  withTheme(
    <>
      <Edge />
      <Edge vertical />
    </>,
  );

  const tokens = (name: string) => screen.getByRole("separator", { name }).className.split(" ");
  expect(tokens("Em pé")).not.toContain("ms-1.5");

  fireEvent.keyDown(screen.getByRole("separator", { name: "Em pé" }), { key: "Enter" });
  expect(flex("inicio")).toBe("0");
  expect(tokens("Em pé")).toContain("ms-1.5");

  fireEvent.keyDown(screen.getByRole("separator", { name: "Em pé do fim" }), { key: "Enter" });
  expect(flex("fim")).toBe("0");
  expect(tokens("Em pé do fim")).toContain("me-1.5");

  fireEvent.keyDown(screen.getByRole("separator", { name: "Deitada" }), { key: "Enter" });
  expect(flex("topo")).toBe("0");
  expect(tokens("Deitada")).toContain("mt-1.5");
  expect(tokens("Deitada")).not.toContain("ms-1.5");

  fireEvent.keyDown(screen.getByRole("separator", { name: "Em pé" }), { key: "Enter" });
  expect(tokens("Em pé")).not.toContain("ms-1.5");
});
