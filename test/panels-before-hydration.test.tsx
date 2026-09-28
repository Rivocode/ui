import { expect, spyOn, test } from "bun:test";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../src/components/resizable";
import { Splitter } from "../src/components/splitter";

function panelsOf(html: string) {
  const host = document.createElement("div");
  host.innerHTML = html;
  return [...host.querySelectorAll<HTMLElement>("[data-panel]")].map((panel) => panel.style.flex);
}

function separatorsOf(html: string) {
  const host = document.createElement("div");
  host.innerHTML = html;
  return [...host.querySelectorAll<HTMLElement>("[role=separator]")];
}

test("no servidor, o painel sem medida fica com o que o defaultSize do vizinho deixa", () => {
  const html = renderToString(
    <ResizablePanelGroup>
      <ResizablePanel defaultSize={30}>A</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>B</ResizablePanel>
    </ResizablePanelGroup>,
  );

  expect(panelsOf(html)).toEqual(["30 1 0%", "70 1 0%"]);
});

test("no servidor, o que sobra se divide igual entre os paineis sem medida", () => {
  const html = renderToString(
    <ResizablePanelGroup>
      <ResizablePanel defaultSize={40}>A</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>B</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>C</ResizablePanel>
    </ResizablePanelGroup>,
  );

  expect(panelsOf(html)).toEqual(["40 1 0%", "30 1 0%", "30 1 0%"]);
});

test("no servidor, o layout controlado vence o defaultSize", () => {
  const html = renderToString(
    <ResizablePanelGroup layout={[25, 75]}>
      <ResizablePanel defaultSize={60}>A</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>B</ResizablePanel>
    </ResizablePanelGroup>,
  );

  expect(panelsOf(html)).toEqual(["25 1 0%", "75 1 0%"]);
});

test("no servidor, o Splitter controlado sai na medida pedida, e nao meio a meio", () => {
  const html = renderToString(<Splitter label="Lista e detalhe" start="A" end="B" size={30} />);
  expect(panelsOf(html)).toEqual(["30 1 0%", "70 1 0%"]);

  const plain = renderToString(<Splitter label="Lista e detalhe" start="A" end="B" />);
  expect(panelsOf(plain)).toEqual(["50 1 0%", "50 1 0%"]);
});

test("no servidor, a divisoria ja entra no Tab e ja diz a medida e os limites", () => {
  const html = renderToString(<Splitter label="Lista e detalhe" start="A" end="B" size={30} />);
  const [separator] = separatorsOf(html);

  expect(separator!.getAttribute("tabindex")).toBe("0");
  expect(separator!.getAttribute("aria-valuenow")).toBe("30");
  expect(separator!.getAttribute("aria-valuemin")).toBe("15");
  expect(separator!.getAttribute("aria-valuemax")).toBe("85");
  expect(separator!.getAttribute("aria-valuetext")).toBe("30%");
});

test("no servidor, cada divisoria de tres paineis mede o painel antes dela e aponta para ele", () => {
  const html = renderToString(
    <ResizablePanelGroup>
      <ResizablePanel id="arvore" defaultSize={20}>
        A
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="editor" defaultSize={50} minSize={20}>
        B
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="inspetor" minSize={15}>
        C
      </ResizablePanel>
    </ResizablePanelGroup>,
  );
  const [first, second] = separatorsOf(html);

  expect(first!.getAttribute("aria-valuenow")).toBe("20");
  expect(first!.getAttribute("aria-controls")).toBe("arvore");
  expect(second!.getAttribute("aria-valuenow")).toBe("50");
  expect(second!.getAttribute("aria-controls")).toBe("editor");
  expect(second!.getAttribute("aria-valuemax")).toBe("65");
});

test("a hidratacao encontra no cliente o mesmo que o servidor desenhou", async () => {
  const tree: ReactNode = (
    <ResizablePanelGroup>
      <ResizablePanel defaultSize={30}>A</ResizablePanel>
      <ResizableHandle aria-label="Entre A e B" />
      <ResizablePanel>B</ResizablePanel>
    </ResizablePanelGroup>
  );
  const host = document.createElement("div");
  host.innerHTML = renderToString(tree);
  document.body.appendChild(host);

  const errors = spyOn(console, "error").mockImplementation(() => {});
  const recoverable: unknown[] = [];
  try {
    const root = await act(async () =>
      hydrateRoot(host, tree, { onRecoverableError: (error) => recoverable.push(error) }),
    );
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    expect(
      [...host.querySelectorAll<HTMLElement>("[data-panel]")].map((panel) => panel.style.flexGrow),
    ).toEqual(["30", "70"]);
    act(() => root.unmount());
  } finally {
    errors.mockRestore();
    host.remove();
  }
});
