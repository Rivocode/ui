import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/table";

function Example() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Prefeitura de Joao Pessoa</TableCell>
          <TableCell>R$ 12.400,00</TableCell>
        </TableRow>
        <TableRow selected>
          <TableCell>Clinica Sao Lucas</TableCell>
          <TableCell>R$ 3.200,00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

test("sai como tabela de verdade, nao como grade de divs", () => {
  render(<Example />);
  expect(screen.getByRole("table")).toBeDefined();
  expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  expect(screen.getAllByRole("row")).toHaveLength(3);
});

const pickedRow = () =>
  screen.getAllByRole("row").find((row) => row.className.includes("bg-selected"))!;

test("a linha selecionada se marca para o leitor de tela, nao so com cor", () => {
  render(<Example />);
  const picked = pickedRow();
  expect(picked).toBeDefined();
  const first = picked.querySelector("td");
  expect(first?.querySelector(".sr-only")?.textContent?.trim()).toBe("Selecionada");
  expect(picked.textContent).toContain("Selecionada");
});

test("o marcador abre a primeira celula, e nao aparece nas outras linhas", () => {
  render(<Example />);
  const cells = [...pickedRow().querySelectorAll("td")];
  expect(cells[0]!.textContent).toBe("Selecionada Clinica Sao Lucas");
  expect(cells[1]!.querySelector(".sr-only")).toBeNull();
  const loose = screen
    .getAllByRole("row")
    .find((row) => !row.className.includes("bg-selected") && row.querySelector("td"))!;
  expect(loose.textContent).not.toContain("Selecionada");
});

test("nao promete aria-selected, que role=table descarta", () => {
  render(<Example />);
  for (const row of screen.getAllByRole("row")) {
    expect(row.hasAttribute("aria-selected")).toBe(false);
  }
});

test("o marcador troca de idioma pela prop labels", () => {
  render(
    <Table>
      <TableBody>
        <TableRow selected labels={{ selected: "Selected" }}>
          <TableCell>Clinica Sao Lucas</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const cell = screen.getAllByRole("cell")[0]!;
  expect(cell.querySelector(".sr-only")?.textContent?.trim()).toBe("Selected");
  expect(cell.textContent).not.toContain("Selecionada");
});

test("a tabela rola de lado sem empurrar a pagina", () => {
  render(<Example />);
  const frame = screen.getByRole("table").parentElement;
  expect(frame?.className).toContain("overflow-x-auto");
});

test("o espacamento da celula segue a densidade", () => {
  render(<Example />);
  expect(screen.getAllByRole("cell")[0]!.className).toContain("--rc-control-pad");
});
