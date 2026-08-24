import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/primitives/button";
import { useToast } from "../src/primitives/toast";
import { RivoProvider } from "../src/provider/rivo-provider";

function Disparo() {
  const toast = useToast();
  return (
    <Button onClick={() => toast.add({ title: "Nota emitida", description: "Numero 4816." })}>
      Emitir
    </Button>
  );
}

test("o aviso aparece depois da acao, sem o app montar portal nenhum", () => {
  render(
    <RivoProvider>
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  expect(screen.getByText("Nota emitida")).toBeDefined();
  expect(screen.getByText("Numero 4816.")).toBeDefined();
});

test("o aviso aparece dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Nota emitida");
});

test("usar o aviso fora do Provider da erro, e nao silencio", () => {
  function Solto() {
    useToast();
    return null;
  }
  expect(() => render(<Solto />)).toThrow();
});

test("o gerenciador tem identidade estavel, senao um useEffect entra em laco", () => {
  const vistos: unknown[] = [];
  function Espia() {
    vistos.push(useToast());
    return null;
  }
  const { rerender } = render(
    <RivoProvider>
      <Espia />
    </RivoProvider>,
  );
  rerender(
    <RivoProvider>
      <Espia />
    </RivoProvider>,
  );
  expect(vistos.length).toBeGreaterThan(1);
  expect(vistos.every((v) => v === vistos[0])).toBe(true);
});
