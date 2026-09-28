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

function Example({ theme }: { theme?: "rivocode-dark" | "rivocode-light" } = {}) {
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

test("the panel opens with title, description and the close button", () => {
  render(<Example />);
  expect(screen.getByText("Periodo")).toBeDefined();
  expect(screen.getByText("Escolha o intervalo do relatorio.")).toBeDefined();
  expect(screen.getByText("Fechar")).toBeDefined();
});

test("the trigger announces the panel to the screen reader", () => {
  render(<Example />);
  const trigger = screen.getByText("Filtros");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(trigger.getAttribute("aria-controls")).toBeTruthy();
});

test("the panel opens inside the container that carries the theme", () => {
  render(<Example theme="rivocode-light" />);
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Periodo");
});

test("the panel swaps list padding for reading padding", () => {
  render(<Example />);
  const panel = screen.getByText("Periodo").closest("[data-open]");
  // The padding comes from the panel token, which shrinks along with density,
  // and not from the menu item `p-1` that the shared shell brings.
  expect(panel!.className).toContain("p-[var(--rc-pad-panel-sm)]");
  expect(panel!.className).not.toContain("p-1 ");
});

test("the consumer's className beats the default", () => {
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
  const panel = screen.getByText("Sem respiro").closest("[data-open]");
  expect(panel!.className.split(" ")).toContain("p-0");
  expect(panel!.className).not.toContain("p-[var(--rc-pad-panel-sm)]");
});
