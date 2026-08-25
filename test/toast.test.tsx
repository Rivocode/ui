import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/components/button";
import { useToast } from "../src/components/toast";
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

test("o canto do aviso e escolhido no provider, e nao no CSS de quem usa", () => {
  render(
    <RivoProvider scope="local" toastPosition="top-left">
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  const area = document.querySelector('[class*="fixed"][class*="top-4"]');
  expect(area).not.toBeNull();
  expect(area!.className).toContain("left-4");
  // O padrao nao pode sobrar junto: os dois cantos ao mesmo tempo deixariam a
  // area presa no de baixo, e a escolha seria silenciosamente ignorada.
  expect(area!.className).not.toContain("bottom-4");
});

test("o aviso entra pela borda mais proxima, e nao atravessa a tela", () => {
  render(
    <RivoProvider scope="local" toastPosition="top-left">
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  const aviso = screen.getByText("Nota emitida").closest("[class*='rounded-lg']");
  expect(aviso).not.toBeNull();
  // Ancorado a esquerda, ele desliza da esquerda.
  expect(aviso!.className).toContain("data-[starting-style]:-translate-x-4");
});
