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

test("renders as a real table, not as a grid of divs", () => {
  render(<Example />);
  expect(screen.getByRole("table")).toBeDefined();
  expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  expect(screen.getAllByRole("row")).toHaveLength(3);
});

const pickedRow = () =>
  screen.getAllByRole("row").find((row) => row.className.includes("bg-selected"))!;

test("the selected row is marked for the screen reader, not only with color", () => {
  render(<Example />);
  const picked = pickedRow();
  expect(picked).toBeDefined();
  const first = picked.querySelector("td");
  expect(first?.querySelector(".sr-only")?.textContent?.trim()).toBe("Selecionada");
  expect(picked.textContent).toContain("Selecionada");
});

test("the marker opens the first cell, and does not show on the other rows", () => {
  render(<Example />);
  const cells = [...pickedRow().querySelectorAll("td")];
  expect(cells[0]!.textContent).toBe("Selecionada Clinica Sao Lucas");
  expect(cells[1]!.querySelector(".sr-only")).toBeNull();
  const loose = screen
    .getAllByRole("row")
    .find((row) => !row.className.includes("bg-selected") && row.querySelector("td"))!;
  expect(loose.textContent).not.toContain("Selecionada");
});

test("does not promise aria-selected, which role=table discards", () => {
  render(<Example />);
  for (const row of screen.getAllByRole("row")) {
    expect(row.hasAttribute("aria-selected")).toBe(false);
  }
});

test("the marker changes language through the labels prop", () => {
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

test("the table scrolls sideways without pushing the page", () => {
  render(<Example />);
  const frame = screen.getByRole("table").parentElement;
  expect(frame?.className).toContain("overflow-x-auto");
});

test("the cell spacing follows the density", () => {
  render(<Example />);
  expect(screen.getAllByRole("cell")[0]!.className).toContain("--rc-control-pad");
});

test("the scrolling frame is the positioning block, so the cell's sr-only text does not widen the page", () => {
  const { container } = render(<Example />);
  const frame = container.querySelector("table")!.parentElement!;
  const tokens = frame.className.split(" ");
  expect(tokens).toContain("overflow-x-auto");
  expect(tokens).toContain("relative");
});
