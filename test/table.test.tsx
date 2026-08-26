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

test("a linha selecionada se marca para o leitor de tela, nao so com cor", () => {
  render(<Example />);
  const rows = screen.getAllByRole("row");
  const selecionada = rows.find((l) => l.getAttribute("aria-selected") === "true");
  expect(selecionada).toBeDefined();
  expect(selecionada!.className).toContain("bg-selected");
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
