import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/table";

/*
 * Whoever assembled the Table by hand wrote the title in a <p> above it. Nothing
 * breaks, and the screen reader announces "table, 3 columns, 2 rows" and nothing
 * else: neighboring text names no element, and on a screen with two tables both
 * arrive without a name.
 *
 * What these tests guard is the name: that the caption renders as a <caption>
 * inside the same <table>, and that its accessible name comes from there - even
 * when the caption is hidden from the screen.
 */

const CAPTION = "Pagamentos recebidos em junho de 2025";

function renderTable(caption: ReactNode = <TableCaption>{CAPTION}</TableCaption>) {
  return render(
    <Table>
      {caption}
      <TableHeader>
        <TableRow>
          <TableHead>Identificador</TableHead>
          <TableHead>Meio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>PIX-9021</TableCell>
          <TableCell>Pix</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
}

test("the caption renders as a <caption> inside the same <table>", () => {
  const { container } = renderTable();

  const caption = container.querySelector("caption");
  expect(caption).not.toBeNull();
  expect(caption!.textContent).toBe(CAPTION);
  // Inside the <table>, and not in the scrolling <div> the Table draws around it:
  // the parentage is what makes it the name, and not just any paragraph.
  expect(caption!.parentElement).toBe(container.querySelector("table"));
});

test("the caption is the table's accessible name", () => {
  renderTable();

  expect(screen.getByRole("table", { name: CAPTION })).toBeDefined();
});

test("without a caption the table arrives without a name, which is the case the component fixes", () => {
  renderTable(null);

  expect(screen.queryByRole("table", { name: CAPTION })).toBeNull();
  expect(screen.getByRole("table").getAttribute("aria-label")).toBeNull();
});

test("a heading above the table does not name the table", () => {
  render(
    <>
      <h3>{CAPTION}</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>PIX-9021</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>,
  );

  expect(screen.getByRole("heading", { name: CAPTION })).toBeDefined();
  expect(screen.queryByRole("table", { name: CAPTION })).toBeNull();
});

test("hidden from the screen, the caption still names", () => {
  const { container } = renderTable(<TableCaption className="sr-only">{CAPTION}</TableCaption>);

  expect(container.querySelector("caption")!.className).toContain("sr-only");
  expect(screen.getByRole("table", { name: CAPTION })).toBeDefined();
});

test("the caption does not enter the table's row count", () => {
  renderTable();

  // <caption> is not <tr>: if it became a row, every table with a caption
  // would announce one row more than it has.
  expect(screen.getAllByRole("row")).toHaveLength(2);
});

test("the caption aligns left, and not to the center the browser gives", () => {
  const { container } = renderTable();

  expect(container.querySelector("caption")!.className).toContain("text-left");
});

test("the consumer's class beats the TableCaption one", () => {
  const { container } = renderTable(<TableCaption className="caption-bottom">{CAPTION}</TableCaption>);

  const caption = container.querySelector("caption")!;
  expect(caption.className).toContain("caption-bottom");
  expect(caption.className).not.toContain("caption-top");
});

test("the caption is exported from the package's public index", async () => {
  const index = await import("../src/index");

  expect(index.TableCaption).toBe(TableCaption);
});
