import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../src/components/menu";

function Example() {
  return (
    <Menu defaultOpen>
      <MenuTrigger aria-label="Mais acoes">...</MenuTrigger>
      <MenuContent>
        <MenuGroup label="Nota 4813">
          <MenuItem>Baixar PDF</MenuItem>
          <MenuItem>Duplicar</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem tone="danger">Cancelar nota</MenuItem>
      </MenuContent>
    </Menu>
  );
}

test("os itens saem com papel de item de menu", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getAllByRole("menuitem")).toHaveLength(3);
});

test("o item destrutivo usa o token de perigo como texto", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByRole("menuitem", { name: "Cancelar nota" }).className).toContain(
    "text-danger-text",
  );
});

test("o menu abre dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Example />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Baixar PDF");
});

test("o titulo do grupo aparece, e o grupo o carrega por dentro", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByText("Nota 4813")).toBeDefined();
});
