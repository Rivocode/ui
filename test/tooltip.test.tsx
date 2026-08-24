import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../src/primitives/tooltip";

function Exemplo() {
  return (
    <Tooltip defaultOpen>
      <TooltipTrigger aria-label="Excluir">x</TooltipTrigger>
      <TooltipContent>Excluir nota</TooltipContent>
    </Tooltip>
  );
}

test("a dica aparece e diz o que o botao de icone faz", () => {
  render(
    <RivoProvider>
      <Exemplo />
    </RivoProvider>,
  );
  expect(screen.getByText("Excluir nota")).toBeDefined();
});

test("a dica nao precisa de provedor proprio, o RivoProvider ja carrega", () => {
  expect(() =>
    render(
      <RivoProvider>
        <Exemplo />
      </RivoProvider>,
    ),
  ).not.toThrow();
});

test("a dica abre dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Exemplo />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Excluir nota");
});
