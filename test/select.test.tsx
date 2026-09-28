import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/components/select";

const OPTIONS = [
  { label: "Abertas", value: "abertas" },
  { label: "Pagas", value: "pagas" },
];

function Example() {
  return (
    <Select items={OPTIONS} defaultValue="abertas" defaultOpen>
      <SelectTrigger aria-label="Status">
        <SelectValue placeholder="Escolha" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="abertas">Abertas</SelectItem>
        <SelectItem value="pagas">Pagas</SelectItem>
      </SelectContent>
    </Select>
  );
}

test("the trigger announces the chosen value", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByLabelText("Status").textContent).toContain("Abertas");
});

test("the options open inside the container that carries the theme", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Example />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Pagas");
});

test("the stacking comes from the scale", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  const list = screen.getByRole("listbox");
  expect(list.closest('[class*="--rc-z-dropdown"]')).not.toBeNull();
});

test("without the options list the trigger would show the raw value, and that is a Base UI contract", () => {
  render(
    <RivoProvider>
      <Select defaultValue="abertas">
        <SelectTrigger aria-label="Sem itens">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="abertas">Abertas</SelectItem>
        </SelectContent>
      </Select>
    </RivoProvider>,
  );
  expect(screen.getByLabelText("Sem itens").textContent).toContain("abertas");
});
