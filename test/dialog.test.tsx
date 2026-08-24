import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../src/components/dialog";
import { RivoProvider } from "../src/provider/rivo-provider";

function Exemplo() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Excluir projeto</DialogTitle>
        <DialogDescription>Esta acao nao pode ser desfeita.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

test("o dialogo aberto mostra titulo e descricao", () => {
  render(
    <RivoProvider>
      <Exemplo />
    </RivoProvider>,
  );
  expect(screen.getByText("Excluir projeto")).toBeDefined();
  expect(screen.getByText("Esta acao nao pode ser desfeita.")).toBeDefined();
});

test("no modo escopado o dialogo renderiza dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Exemplo />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container).not.toBeNull();
  expect(container!.contains(screen.getByText("Excluir projeto"))).toBe(true);
});

test("o empilhamento vem da escala, nunca de um numero cravado", () => {
  render(
    <RivoProvider>
      <Exemplo />
    </RivoProvider>,
  );
  const popup = screen.getByRole("dialog");
  expect(popup.className).toContain("--rc-z-dialog");
  expect(popup.className).not.toMatch(/z-\d+/);
});

test("o dialogo exige o Provider e diz isso claramente", () => {
  expect(() => render(<Exemplo />)).toThrow(/RivoProvider/);
});
