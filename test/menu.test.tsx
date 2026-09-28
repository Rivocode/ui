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

test("the items render with the menu item role", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getAllByRole("menuitem")).toHaveLength(3);
});

test("the destructive item uses the danger token as text", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByRole("menuitem", { name: "Cancelar nota" }).className).toContain(
    "text-danger-text",
  );
});

test("the menu opens inside the container that carries the theme", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Example />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Baixar PDF");
});

test("the group title shows up, and the group carries it inside", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByText("Nota 4813")).toBeDefined();
});
