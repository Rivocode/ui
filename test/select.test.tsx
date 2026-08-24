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

const OPCOES = [
  { label: "Abertas", value: "abertas" },
  { label: "Pagas", value: "pagas" },
];

function Exemplo() {
  return (
    <Select items={OPCOES} defaultValue="abertas" defaultOpen>
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

test("o gatilho anuncia o valor escolhido", () => {
  render(
    <RivoProvider>
      <Exemplo />
    </RivoProvider>,
  );
  expect(screen.getByLabelText("Status").textContent).toContain("Abertas");
});

test("as opcoes abrem dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Exemplo />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Pagas");
});

test("o empilhamento vem da escala", () => {
  render(
    <RivoProvider>
      <Exemplo />
    </RivoProvider>,
  );
  const lista = screen.getByRole("listbox");
  expect(lista.closest('[class*="--rc-z-dropdown"]')).not.toBeNull();
});

test("sem a lista de opcoes o gatilho mostraria o valor cru, e isso e contrato da Base UI", () => {
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
