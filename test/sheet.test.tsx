import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHandle,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from "../src/components/sheet";

function Example({ side }: { side?: SheetSide }) {
  return (
    <RivoProvider scope="local">
      <Sheet side={side} defaultOpen>
        <SheetTrigger>Abrir menu</SheetTrigger>
        <SheetContent>
          <SheetHandle />
          <SheetTitle>Navegacao</SheetTitle>
          <SheetDescription>Escolha para onde ir.</SheetDescription>
          <SheetClose>Fechar</SheetClose>
        </SheetContent>
      </Sheet>
    </RivoProvider>
  );
}

test("the sheet opens with title and description", () => {
  render(<Example />);
  expect(screen.getByText("Navegacao")).toBeDefined();
  expect(screen.getByText("Escolha para onde ir.")).toBeDefined();
});

test("the sheet opens inside the container that carries the theme", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Sheet defaultOpen>
        <SheetTrigger>Abrir</SheetTrigger>
        <SheetContent>
          <SheetTitle>Navegacao</SheetTitle>
        </SheetContent>
      </Sheet>
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Navegacao");
});

test("the close button closes", () => {
  render(<Example />);
  fireEvent.click(screen.getByText("Fechar"));
  expect(screen.queryByText("Navegacao")).toBeNull();
});

test("the grab handle is left out of screen reading", () => {
  const { container } = render(<Example />);
  const bar = container.ownerDocument.querySelector('[aria-hidden="true"].rounded-pill');
  expect(bar).not.toBeNull();
});

test("the chosen side drives the close gesture", () => {
  render(<Example side="left" />);
  const panel = screen.getByText("Navegacao").closest("[data-open]")!;
  // Base UI marks the panel with the gesture direction; the left side closes to the
  // left, and not downward.
  expect(panel.outerHTML).toContain("translateX");
});

test("the sheet body inherits the panel height", () => {
  render(<Example side="left" />);
  const panel = screen.getByText("Navegacao").closest("[data-open]")!;
  const body = screen.getByText("Navegacao").parentElement!;
  expect(body.parentElement).toBe(panel as HTMLElement);
  expect(body.className.split(" ")).toContain("h-full");
});

test("the sheet layer stops at the visible area, and not under the browser bar", () => {
  render(<Example />);
  const panel = screen.getByText("Navegacao").closest("[data-open]")!;
  const layer = panel.parentElement!.className.split(" ");
  expect(layer).toContain("h-dvh");
  expect(layer).toContain("top-0");
  expect(layer).not.toContain("inset-0");
});
