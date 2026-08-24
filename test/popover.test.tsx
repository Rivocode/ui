import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../src/components/popover";

function Exemplo({ theme }: { theme?: "rivocode-dark" | "rivocode-light" } = {}) {
  return (
    <RivoProvider scope="local" theme={theme}>
      <Popover defaultOpen>
        <PopoverTrigger>Filtros</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Periodo</PopoverTitle>
          <PopoverDescription>Escolha o intervalo do relatorio.</PopoverDescription>
          <PopoverClose>Fechar</PopoverClose>
        </PopoverContent>
      </Popover>
    </RivoProvider>
  );
}

test("o painel abre com titulo, descricao e o botao de fechar", () => {
  render(<Exemplo />);
  expect(screen.getByText("Periodo")).toBeDefined();
  expect(screen.getByText("Escolha o intervalo do relatorio.")).toBeDefined();
  expect(screen.getByText("Fechar")).toBeDefined();
});

test("o gatilho anuncia o painel para o leitor de tela", () => {
  render(<Exemplo />);
  const gatilho = screen.getByText("Filtros");
  expect(gatilho.getAttribute("aria-expanded")).toBe("true");
  expect(gatilho.getAttribute("aria-controls")).toBeTruthy();
});

test("o painel abre dentro do container que carrega o tema", () => {
  render(<Exemplo theme="rivocode-light" />);
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Periodo");
});

test("o painel troca o respiro de lista pelo de leitura", () => {
  render(<Exemplo />);
  const painel = screen.getByText("Periodo").closest("[data-open]");
  // O respiro vem do token de painel, que encolhe junto com a densidade, e
  // nao do `p-1` de item de menu que a casca compartilhada traz.
  expect(painel!.className).toContain("p-[var(--rc-pad-panel-sm)]");
  expect(painel!.className).not.toContain("p-1 ");
});

test("o className de quem usa vence o padrao", () => {
  render(
    <RivoProvider scope="local">
      <Popover defaultOpen>
        <PopoverTrigger>Abrir</PopoverTrigger>
        <PopoverContent className="p-0">
          <span>Sem respiro</span>
        </PopoverContent>
      </Popover>
    </RivoProvider>,
  );
  const painel = screen.getByText("Sem respiro").closest("[data-open]");
  expect(painel!.className).toContain("p-0");
  expect(painel!.className).not.toContain("p-[var(--rc-pad-panel-sm)]");
});
