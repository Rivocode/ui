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

test("a folha abre com titulo e descricao", () => {
  render(<Example />);
  expect(screen.getByText("Navegacao")).toBeDefined();
  expect(screen.getByText("Escolha para onde ir.")).toBeDefined();
});

test("a folha abre dentro do container que carrega o tema", () => {
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

test("o botao de fechar fecha", () => {
  render(<Example />);
  fireEvent.click(screen.getByText("Fechar"));
  expect(screen.queryByText("Navegacao")).toBeNull();
});

test("a barrinha de pegar nao entra na leitura de tela", () => {
  const { container } = render(<Example />);
  const bar = container.ownerDocument.querySelector('[aria-hidden="true"].rounded-pill');
  expect(bar).not.toBeNull();
});

test("o lado escolhido manda no gesto de fechar", () => {
  render(<Example side="left" />);
  const panel = screen.getByText("Navegacao").closest("[data-open]")!;
  // A Base UI marca o painel com a direcao do gesto; a esquerda fecha pela
  // esquerda, e nao para baixo.
  expect(panel.outerHTML).toContain("translateX");
});
